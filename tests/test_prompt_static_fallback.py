from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_prompt_fallback",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert SPEC and SPEC.loader
RUNTIME = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUNTIME)


def artifact_with(block: dict[str, object]) -> dict[str, object]:
    return {
        "sceneDocuments": [
            {
                "sourcePathId": "ex:path-test",
                "scenes": [
                    {
                        "id": "ex:scene-test--scene",
                        "source": [{"resourceId": "ex:scene-test"}],
                        "blocks": [block],
                    }
                ],
            }
        ]
    }


class PromptStaticFallbackTests(unittest.TestCase):
    def test_free_text_prompt_renders_without_options(self) -> None:
        fallback = RUNTIME.static_fallback(
            artifact_with(
                {
                    "id": "ex:exercise--block",
                    "kind": "prompt",
                    "source": [
                        {
                            "resourceId": "ex:exercise",
                            "relationPath": "cd:body",
                        }
                    ],
                    "prompt": "Explain the result in your own words.",
                    "responseMode": "free-text",
                    "fallback": "Explain the result in your own words.",
                }
            )
        )
        self.assertIn('class="prompt-fallback"', fallback)
        self.assertIn('data-resource-id="ex:exercise"', fallback)
        self.assertIn('data-relation-path="cd:body"', fallback)
        self.assertIn("Explain the result in your own words.", fallback)
        self.assertNotIn("poll-fallback", fallback)
        self.assertNotIn("data-poll-option-ids", fallback)

    def test_single_choice_prompt_keeps_existing_poll_fallback_contract(self) -> None:
        fallback = RUNTIME.static_fallback(
            artifact_with(
                {
                    "id": "ex:poll--block",
                    "kind": "prompt",
                    "source": [
                        {"resourceId": "ex:poll", "relationPath": "cd:hasAudiencePoll"},
                        {"resourceId": "ex:option-a", "relationPath": "cd:hasPollOption"},
                        {"resourceId": "ex:option-b", "relationPath": "cd:hasPollOption"},
                    ],
                    "prompt": "Choose one.",
                    "responseMode": "single-choice",
                    "options": ["A", "B"],
                    "fallback": "Choose one. A / B",
                }
            )
        )
        self.assertIn('class="poll-fallback"', fallback)
        self.assertIn('data-poll-key="ex:poll"', fallback)
        self.assertIn('data-poll-option-ids="ex:option-a ex:option-b"', fallback)
        self.assertIn("<li>A</li><li>B</li>", fallback)

    def test_unsupported_prompt_response_mode_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "Unsupported prompt response mode: multiple-choice"):
            RUNTIME.static_fallback(
                artifact_with(
                    {
                        "id": "ex:unsupported--block",
                        "kind": "prompt",
                        "source": [{"resourceId": "ex:unsupported"}],
                        "prompt": "Unsupported prompt.",
                        "responseMode": "multiple-choice",
                        "fallback": "Unsupported prompt.",
                    }
                )
            )

    def test_keypoint_list_fallback_remains_intact(self) -> None:
        fallback = RUNTIME.static_fallback(
            artifact_with(
                {
                    "id": "ex:keypoints--block",
                    "kind": "list",
                    "source": [
                        {
                            "resourceId": "ex:owner",
                            "relationPath": "cd:hasKeyPoint",
                        }
                    ],
                    "listStyle": "unordered",
                    "items": [
                        {
                            "id": "ex:keypoint-1--list-item",
                            "text": "First point",
                            "source": [
                                {
                                    "resourceId": "ex:keypoint-1",
                                    "relationPath": "cd:body",
                                }
                            ],
                        }
                    ],
                }
            )
        )
        self.assertIn('class="keypoint-list"', fallback)
        self.assertIn('data-list-item-id="ex:keypoint-1--list-item"', fallback)
        self.assertIn("First point", fallback)


if __name__ == "__main__":
    unittest.main()
