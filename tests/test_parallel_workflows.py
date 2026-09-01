import copy
import json
import unittest
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / ".agents" / "workflows" / "index.json"
ROOT_CONFIG_PATH = ROOT / ".agents" / "workflow-config.json"
STATE_SCHEMA_PATH = ROOT / ".agents" / "state.schema.json"
AGENTS_PATH = ROOT / "AGENTS.md"
PROTOCOL_PATH = ROOT / ".agents" / "dispatcher-protocol.md"
OPERATING_MODEL_PATH = ROOT / "docs" / "agent-operating-model.md"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


class ParallelWorkflowContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = load_json(INDEX_PATH)
        cls.root_config = load_json(ROOT_CONFIG_PATH)
        cls.state_schema = load_json(STATE_SCHEMA_PATH)
        cls.workflows = {entry["track"]: entry for entry in cls.index["workflows"]}
        cls.configs = {
            track: load_json(ROOT / entry["workflowConfig"])
            for track, entry in cls.workflows.items()
        }
        cls.states = {
            track: load_json(ROOT / entry["state"])
            for track, entry in cls.workflows.items()
        }

    def assert_parseable_datetime(self, value, field_name):
        self.assertIsInstance(value, str, f"{field_name} must be a string")
        try:
            return datetime.fromisoformat(value)
        except (TypeError, ValueError):
            self.fail(f"{field_name} must be a parseable ISO datetime: {value!r}")

    def assert_track_state_contract(self, track, state):
        state_keys = set(self.state_schema["properties"])
        self.assertEqual(set(self.state_schema["required"]), state_keys)
        lease_schema = self.state_schema["properties"]["lease"]
        lease_keys = set(lease_schema["properties"])
        self.assertEqual(set(lease_schema["required"]), lease_keys)
        transition_schema = self.state_schema["properties"]["transitionHistory"]["items"]
        transition_keys = set(transition_schema["properties"])
        self.assertEqual(set(transition_schema["required"]), transition_keys)
        valid_statuses = set(self.state_schema["properties"]["status"]["enum"])
        valid_turns = set(self.state_schema["properties"]["turn"]["enum"])

        self.assertEqual(set(state), state_keys)
        self.assertEqual(set(state["lease"]), lease_keys)
        self.assertIn(state["status"], valid_statuses)
        self.assertIn(state["turn"], valid_turns)
        self.assertIn(state["nextTurn"], valid_turns)

        if state["status"] in {"ready", "busy"}:
            self.assertEqual(
                state["nextTurn"],
                state["turn"],
                "ready/busy state must keep nextTurn aligned with turn",
            )

        lease = state["lease"]
        if state["status"] == "busy":
            self.assertIsInstance(lease["owner"], str)
            self.assertTrue(lease["owner"].strip(), "busy state requires a lease owner")
            claimed_at = self.assert_parseable_datetime(
                lease["claimedAt"], "lease.claimedAt"
            )
            expires_at = self.assert_parseable_datetime(
                lease["expiresAt"], "lease.expiresAt"
            )
            self.assertGreater(
                expires_at,
                claimed_at,
                "busy lease must expire after it was claimed",
            )
        else:
            self.assertEqual(
                lease,
                {"owner": None, "claimedAt": None, "expiresAt": None},
                "non-busy track state must not retain an active lease",
            )

        if state["activeIssue"] is not None:
            self.assertIsInstance(state["activeIssue"], int)
            self.assertGreaterEqual(state["activeIssue"], 1)
        if state["activeRole"] is not None:
            self.assertIsInstance(state["activeRole"], str)
            self.assertTrue(state["activeRole"].strip())

        self.assertGreaterEqual(state["stateRevision"], 0)
        self.assertLessEqual(
            len(state["transitionHistory"]),
            self.configs[track]["transition_history_limit"],
        )
        self.assert_parseable_datetime(state["lastUpdated"], "lastUpdated")
        for transition in state["transitionHistory"]:
            self.assertEqual(set(transition), transition_keys)
            self.assert_parseable_datetime(transition["at"], "transition.at")
            for field in ("from", "to", "actor", "reason"):
                self.assertIsInstance(transition[field], str)

    def test_registry_exposes_exactly_two_worker_lanes(self):
        self.assertEqual(set(self.workflows), {"system", "chemometrics"})
        self.assertFalse(self.index["legacy"]["workerExecution"])
        self.assertEqual(self.index["legacy"]["workflowConfig"], ".agents/workflow-config.json")
        self.assertEqual(self.index["legacy"]["state"], ".agents/state.json")
        self.assertEqual(self.index["legacy"]["postMigrationPurpose"], "migration-audit-only")

    def test_workflow_ids_and_state_files_are_distinct(self):
        workflow_ids = [config["workflow_id"] for config in self.configs.values()]
        state_files = [config["state_file"] for config in self.configs.values()]
        self.assertTrue(all(workflow_ids))
        self.assertEqual(len(workflow_ids), len(set(workflow_ids)))
        self.assertNotIn(self.root_config["workflow_id"], workflow_ids)
        self.assertEqual(len(state_files), len(set(state_files)))
        for track, entry in self.workflows.items():
            self.assertEqual(self.configs[track]["state_file"], entry["state"])

    def test_track_configs_preserve_core_validation_and_merge_contract(self):
        for config in self.configs.values():
            self.assertEqual(set(config), set(self.root_config))
            self.assertEqual(config["maximum_turns_per_run"], 1)
            self.assertEqual(config["core"], self.root_config["core"])
            self.assertEqual(config["state_schema"], self.root_config["state_schema"])
            self.assertEqual(config["project_protocol"], self.root_config["project_protocol"])
            self.assertEqual(config["manager_role_profile"], self.root_config["manager_role_profile"])
            self.assertEqual(config["validation"], self.root_config["validation"])
            self.assertEqual(config["merge_policy"], self.root_config["merge_policy"])
            self.assertEqual(config["validation"]["provider"], "external-commit-status")
            self.assertTrue(config["validation"]["requireExactHead"])
            self.assertEqual(
                config["validation"]["requiredContexts"],
                ["agent-validator/project-chemie-digital"],
            )
            self.assertTrue(config["merge_policy"]["manager_only"])
            self.assertEqual(config["merge_policy"]["merge_method"], "squash")
            self.assertEqual(config["merge_policy"]["base_branch"], "main")

    def test_track_states_reuse_existing_state_contract(self):
        for track, state in self.states.items():
            self.assert_track_state_contract(track, state)

    def test_lifecycle_regression_fixtures(self):
        system_state = copy.deepcopy(self.states["system"])

        busy = copy.deepcopy(system_state)
        busy["status"] = "busy"
        busy["turn"] = "worker"
        busy["nextTurn"] = "worker"
        busy["activeRole"] = "Test Worker"
        busy["activeIssue"] = 999
        busy["lastUpdated"] = "2026-09-01T10:00:00+02:00"
        busy["lease"] = {
            "owner": "fixture-worker",
            "claimedAt": "2026-09-01T10:00:00+02:00",
            "expiresAt": "2026-09-01T12:00:00+02:00",
        }
        self.assert_track_state_contract("system", busy)

        blocked = copy.deepcopy(system_state)
        blocked["status"] = "blocked"
        blocked["turn"] = "manager"
        blocked["nextTurn"] = "manager"
        blocked["activeRole"] = "Reviewer"
        blocked["activeIssue"] = 999
        blocked["lastUpdated"] = "2026-09-01T10:05:00+02:00"
        blocked["lease"] = {"owner": None, "claimedAt": None, "expiresAt": None}
        self.assert_track_state_contract("system", blocked)

        ready_turn_mismatch = copy.deepcopy(blocked)
        ready_turn_mismatch["status"] = "ready"
        ready_turn_mismatch["turn"] = "manager"
        ready_turn_mismatch["nextTurn"] = "worker"
        with self.assertRaises(AssertionError):
            self.assert_track_state_contract("system", ready_turn_mismatch)

        busy_without_lease = copy.deepcopy(busy)
        busy_without_lease["lease"] = {
            "owner": None,
            "claimedAt": None,
            "expiresAt": None,
        }
        with self.assertRaises(AssertionError):
            self.assert_track_state_contract("system", busy_without_lease)

        blocked_with_lease = copy.deepcopy(blocked)
        blocked_with_lease["lease"] = copy.deepcopy(busy["lease"])
        with self.assertRaises(AssertionError):
            self.assert_track_state_contract("system", blocked_with_lease)

        busy_with_bad_timestamp = copy.deepcopy(busy)
        busy_with_bad_timestamp["lease"]["claimedAt"] = "not-a-timestamp"
        with self.assertRaises(AssertionError):
            self.assert_track_state_contract("system", busy_with_bad_timestamp)

        bad_last_updated = copy.deepcopy(blocked)
        bad_last_updated["lastUpdated"] = "not-a-timestamp"
        with self.assertRaises(AssertionError):
            self.assert_track_state_contract("system", bad_last_updated)

    def test_state_and_lease_mutations_are_independent(self):
        system = copy.deepcopy(self.states["system"])
        chemometrics = copy.deepcopy(self.states["chemometrics"])
        system["stateRevision"] += 1
        system["lease"]["owner"] = "system-worker"
        self.assertEqual(
            chemometrics,
            self.states["chemometrics"],
            "mutating the System fixture must not alter Chemometrics state/lease evidence",
        )
        self.assertNotEqual(system["stateRevision"], chemometrics["stateRevision"])
        self.assertNotEqual(system["lease"]["owner"], chemometrics["lease"]["owner"])

    def test_instructions_pin_track_paths_and_disable_root_execution_lane(self):
        documents = [
            AGENTS_PATH.read_text(encoding="utf-8"),
            PROTOCOL_PATH.read_text(encoding="utf-8"),
            OPERATING_MODEL_PATH.read_text(encoding="utf-8"),
        ]
        required_paths = [
            ".agents/workflows/system/workflow-config.json",
            ".agents/workflows/system/state.json",
            ".agents/workflows/chemometrics/workflow-config.json",
            ".agents/workflows/chemometrics/state.json",
        ]
        for document in documents:
            for required_path in required_paths:
                self.assertIn(required_path, document)
        self.assertIn("must not be used as a manager or worker execution lane", documents[0])
        self.assertIn("not a third execution lane", documents[1])
        self.assertIn("must not be scheduled as a third worker workflow", documents[2])

    def test_root_terminalization_is_manager_only_post_merge_handoff(self):
        agents = AGENTS_PATH.read_text(encoding="utf-8")
        protocol = PROTOCOL_PATH.read_text(encoding="utf-8")
        operating_model = OPERATING_MODEL_PATH.read_text(encoding="utf-8")
        self.assertIn("workerExecution: false", agents)
        self.assertIn("manager merge-completion", protocol)
        self.assertIn("set `status: complete`", protocol)
        self.assertIn("feature PR deliberately does not modify the still-live `.agents/state.json`", protocol)
        self.assertIn("not part of the feature PR", operating_model)

    def test_cross_track_gate_and_integration_freshness_are_documented(self):
        protocol = PROTOCOL_PATH.read_text(encoding="utf-8")
        for field in (
            "Track",
            "Intended write scope",
            "Cross-track dependencies",
            "Shared contract impact",
        ):
            self.assertIn(field, protocol)
        self.assertIn("## Integration freshness", protocol)
        self.assertIn("incompatible stale integration basis", protocol)
        self.assertIn("harmless workflow-state/audit changes", protocol)
        self.assertIn("reconciliation with current `main`", protocol)


if __name__ == "__main__":
    unittest.main()
