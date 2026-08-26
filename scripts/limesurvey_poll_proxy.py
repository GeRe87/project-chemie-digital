#!/usr/bin/env python3
"""Minimal aggregate-only bridge from LimeSurvey RemoteControl 2 to the Reveal pitch.

The browser never receives LimeSurvey credentials, session keys, individual responses,
or teaching labels. Real mode exports only one configured question field and immediately
reduces LimeSurvey answer codes to counts keyed by canonical RDF option ids. Demo mode
requires no network or credentials.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

DEFAULT_POLL_KEY = "ex:sd-precision-poll"
DEFAULT_RPC_URL = "https://limesurvey.uni-due.de/index.php/admin/remotecontrol"
DEFAULT_ORIGIN = "http://127.0.0.1:5173"
DEFAULT_OPTION_IDS = ("ex:sd-precision-option-a", "ex:sd-precision-option-b")


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable {name}")
    return value


def rpc_call(url: str, method: str, params: list[Any]) -> Any:
    payload = json.dumps({"method": method, "params": params, "id": 1}).encode("utf-8")
    request = Request(url, data=payload, headers={"Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urlopen(request, timeout=12) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as error:
        raise RuntimeError(f"LimeSurvey RPC request failed: {error}") from error
    if body.get("error"):
        raise RuntimeError(f"LimeSurvey RPC error: {body['error']}")
    return body.get("result")


def status_error(result: Any) -> str | None:
    if not isinstance(result, dict):
        return None
    code = result.get("error_code")
    status = result.get("status")
    if code or status:
        return f"{code or 'LimeSurvey'}: {status or 'request failed'}"
    return None


def values_for_field(value: Any, field: str) -> Iterable[str]:
    if isinstance(value, dict):
        if field in value and value[field] not in (None, ""):
            yield str(value[field])
        for nested in value.values():
            if isinstance(nested, (dict, list)):
                yield from values_for_field(nested, field)
    elif isinstance(value, list):
        for nested in value:
            yield from values_for_field(nested, field)


def parse_answer_map(raw: str) -> dict[str, str]:
    value = json.loads(raw)
    if (
        not isinstance(value, dict)
        or len(value) < 2
        or not all(isinstance(code, str) and code and isinstance(option_id, str) and option_id for code, option_id in value.items())
        or len(set(value.values())) != len(value)
    ):
        raise RuntimeError(
            "LIMESURVEY_ANSWER_MAP must map at least two unique LimeSurvey answer codes to canonical poll option ids"
        )
    return value


def aggregate_answers(answers: Iterable[str], answer_map: dict[str, str]) -> list[dict[str, Any]]:
    counts = Counter(answer for answer in answers if answer in answer_map)
    return [
        {"id": option_id, "count": counts.get(answer_code, 0)}
        for answer_code, option_id in answer_map.items()
    ]


def demo_aggregate(poll_key: str, tick: int) -> dict[str, Any]:
    count_a = 4 + (tick % 7)
    count_b = 2 + ((tick // 2) % 5)
    return {
        "pollKey": poll_key,
        "participationUrl": "https://limesurvey.uni-due.de/",
        "total": count_a + count_b,
        "options": [
            {"id": DEFAULT_OPTION_IDS[0], "count": count_a},
            {"id": DEFAULT_OPTION_IDS[1], "count": count_b},
        ],
    }


def real_aggregate() -> dict[str, Any]:
    rpc_url = os.environ.get("LIMESURVEY_RPC_URL", DEFAULT_RPC_URL).strip()
    username = require_env("LIMESURVEY_USERNAME")
    password = require_env("LIMESURVEY_PASSWORD")
    auth_plugin = os.environ.get("LIMESURVEY_AUTH_PLUGIN", "").strip()
    survey_id = int(require_env("LIMESURVEY_SURVEY_ID"))
    question_code = require_env("LIMESURVEY_QUESTION_CODE")
    answer_map = parse_answer_map(require_env("LIMESURVEY_ANSWER_MAP"))
    participation_url = os.environ.get(
        "LIMESURVEY_PARTICIPATION_URL",
        f"https://limesurvey.uni-due.de/index.php/{survey_id}?lang=de",
    ).strip()
    poll_key = os.environ.get("PITCH_POLL_KEY", DEFAULT_POLL_KEY).strip()
    qr_code_url = os.environ.get("LIMESURVEY_QR_CODE_URL", "").strip()

    login_params: list[Any] = [username, password]
    if auth_plugin:
        login_params.append(auth_plugin)
    session = rpc_call(rpc_url, "get_session_key", login_params)
    error = status_error(session)
    if error:
        raise RuntimeError(error)
    if not isinstance(session, str) or not session:
        raise RuntimeError("LimeSurvey did not return a session key")
    try:
        exported = rpc_call(
            rpc_url,
            "export_responses",
            [session, survey_id, "json", None, "complete", "code", "short", None, None, [question_code]],
        )
        export_error = status_error(exported)
        if export_error:
            if "NO_DATA" in export_error.upper() or "NO DATA" in export_error.upper():
                answers: list[str] = []
            else:
                raise RuntimeError(export_error)
        else:
            if not isinstance(exported, str):
                raise RuntimeError("LimeSurvey export_responses did not return base64 data")
            decoded = base64.b64decode(exported).decode("utf-8-sig")
            response_json = json.loads(decoded)
            answers = list(values_for_field(response_json, question_code))
    finally:
        try:
            rpc_call(rpc_url, "release_session_key", [session])
        except RuntimeError:
            pass

    options = aggregate_answers(answers, answer_map)
    aggregate: dict[str, Any] = {
        "pollKey": poll_key,
        "participationUrl": participation_url,
        "total": sum(option["count"] for option in options),
        "options": options,
    }
    if qr_code_url:
        aggregate["qrCodeUrl"] = qr_code_url
    return aggregate


class PollHandler(BaseHTTPRequestHandler):
    demo = False
    started = time.monotonic()
    allowed_origin = DEFAULT_ORIGIN

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", self.allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Accept, Content-Type")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/polls/"):
            self._json(404, {"error": "not found"})
            return
        poll_key = unquote(parsed.path[len("/polls/"):])
        expected = os.environ.get("PITCH_POLL_KEY", DEFAULT_POLL_KEY).strip()
        if poll_key != expected:
            self._json(404, {"error": "unknown poll"})
            return
        try:
            if self.demo:
                tick = int((time.monotonic() - self.started) // 2)
                aggregate = demo_aggregate(poll_key, tick)
            else:
                aggregate = real_aggregate()
        except Exception as error:  # keep HTTP boundary fail-closed without exposing credentials
            self._json(502, {"error": str(error)})
            return
        self._json(200, aggregate)

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[poll-proxy] {format % args}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Aggregate-only LimeSurvey bridge for the Reveal pitch")
    parser.add_argument("--demo", action="store_true", help="serve changing deterministic demo counts without LimeSurvey credentials")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()
    PollHandler.demo = args.demo
    PollHandler.allowed_origin = os.environ.get("PITCH_ORIGIN", DEFAULT_ORIGIN).strip()
    server = ThreadingHTTPServer((args.host, args.port), PollHandler)
    mode = "demo" if args.demo else "LimeSurvey"
    print(f"Poll proxy ({mode}) listening on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
