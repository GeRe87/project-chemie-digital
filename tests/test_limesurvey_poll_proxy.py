from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "limesurvey_poll_proxy.py"
SPEC = importlib.util.spec_from_file_location("limesurvey_poll_proxy", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class LimeSurveyPollProxyTests(unittest.TestCase):
    def test_extracts_only_the_configured_question_field(self) -> None:
        response = {
            "responses": [
                {"id": "1", "PRECISION": "A1", "OTHER": "secret-a"},
                {"id": "2", "PRECISION": "A2", "OTHER": "secret-b"},
            ]
        }
        self.assertEqual(["A1", "A2"], list(MODULE.values_for_field(response, "PRECISION")))
        self.assertEqual([], list(MODULE.values_for_field(response, "UNKNOWN")))

    def test_answer_codes_map_to_canonical_option_ids_without_labels(self) -> None:
        answer_map = MODULE.parse_answer_map(json.dumps({
            "A1": "ex:sd-precision-option-a",
            "A2": "ex:sd-precision-option-b",
        }))
        options = MODULE.aggregate_answers(["A1", "A1", "A2", "IGNORED"], answer_map)
        self.assertEqual([
            {"id": "ex:sd-precision-option-a", "count": 2},
            {"id": "ex:sd-precision-option-b", "count": 1},
        ], options)
        self.assertTrue(all("label" not in option for option in options))

    def test_demo_aggregate_contains_only_deployment_metadata_ids_and_counts(self) -> None:
        aggregate = MODULE.demo_aggregate("ex:sd-precision-poll", 3)
        self.assertEqual("ex:sd-precision-poll", aggregate["pollKey"])
        self.assertEqual(sum(option["count"] for option in aggregate["options"]), aggregate["total"])
        self.assertEqual(
            ["ex:sd-precision-option-a", "ex:sd-precision-option-b"],
            [option["id"] for option in aggregate["options"]],
        )
        self.assertTrue(all(set(option) == {"id", "count"} for option in aggregate["options"]))

    def test_proxy_source_does_not_duplicate_authored_poll_labels(self) -> None:
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn("Messreihe A", source)
        self.assertNotIn("Messreihe B", source)

    def test_answer_map_rejects_duplicate_canonical_option_ids(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "unique LimeSurvey answer codes"):
            MODULE.parse_answer_map(json.dumps({
                "A1": "ex:sd-precision-option-a",
                "A2": "ex:sd-precision-option-a",
            }))


if __name__ == "__main__":
    unittest.main()
