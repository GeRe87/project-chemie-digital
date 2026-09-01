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
        state_keys = set(self.state_schema["properties"])
        self.assertEqual(set(self.state_schema["required"]), state_keys)
        lease_keys = set(self.state_schema["properties"]["lease"]["properties"])
        transition_keys = set(
            self.state_schema["properties"]["transitionHistory"]["items"]["properties"]
        )
        valid_statuses = set(self.state_schema["properties"]["status"]["enum"])
        valid_turns = set(self.state_schema["properties"]["turn"]["enum"])

        for track, state in self.states.items():
            self.assertEqual(set(state), state_keys)
            self.assertEqual(set(state["lease"]), lease_keys)
            self.assertIn(state["status"], valid_statuses)
            self.assertIn(state["turn"], valid_turns)
            self.assertIn(state["nextTurn"], valid_turns)
            self.assertEqual(state["status"], "ready")
            self.assertEqual(state["turn"], "manager")
            self.assertEqual(state["nextTurn"], "manager")
            self.assertIsNone(state["activeRole"])
            self.assertIsNone(state["activeIssue"])
            self.assertEqual(state["lease"], {"owner": None, "claimedAt": None, "expiresAt": None})
            self.assertGreaterEqual(state["stateRevision"], 0)
            self.assertLessEqual(
                len(state["transitionHistory"]),
                self.configs[track]["transition_history_limit"],
            )
            datetime.fromisoformat(state["lastUpdated"])
            for transition in state["transitionHistory"]:
                self.assertEqual(set(transition), transition_keys)
                datetime.fromisoformat(transition["at"])

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
        self.assertIsNone(chemometrics["lease"]["owner"])

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
