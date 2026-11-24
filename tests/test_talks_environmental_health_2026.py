"""Bounded EH2026 semantic and actual-compiler regression tests.

One fresh RDF Dataset per class; no subprocess, skips or SHACL pipeline setup.
"""
from pathlib import Path
import re
import sys
import unittest
from rdflib import Dataset, Namespace, URIRef, Literal, RDF, SKOS

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import generate_canonical_runtime as R

CD = Namespace('https://w3id.org/project-chemie-digital/ontology/')
EX = Namespace('https://w3id.org/project-chemie-digital/resource/')
SCHEMA = Namespace('https://schema.org/')
G = 'https://w3id.org/project-chemie-digital/graph/'
NEW_FILE = ROOT / 'ontology/dataset/talks-environmental-health-2026.trig'
PATH = EX['path-talk-environmental-health-2026']
OLD_PATH = EX['path-talk-microplastics-ted-gc-ms']
NEW_GRAPH = URIRef(G + 'paths/talk-environmental-health-2026')
OLD_GRAPH = URIRef(G + 'paths/talk-microplastics-ted-gc-ms')

EXPECTED_RECORDS = [{'number': 1, 'scene_id': 'eh26-scene-01', 'target_seconds': 30, 'word_count': 51, 'voiceover_v1': 'Environmental monitoring increasingly depends on results derived from complex instrumental data.\r\n\r\nIn TED-GC-MS, we do not directly count microplastic particles. We measure chemical signals that can be used to estimate polymer mass.\r\n\r\nToday, I will focus on what happens between that signal and the reported result: processing, documentation, and controlled automation.'}, {'number': 2, 'scene_id': 'eh26-scene-02', 'target_seconds': 65, 'word_count': 118, 'voiceover_v1': 'Consider these two results for SBR, styrene-butadiene rubber, from an influent and an effluent sample.\r\n\r\nOne result is about fifteen point seven micrograms per milligram of sample; the other is about thirteen point six.\r\n\r\nThese values are derived from three analytical replicates each. But the numbers alone tell us remarkably little.\r\n\r\nWhich chromatographic signals were selected? How were overlapping signals handled? Which calibration standards were used? And which version of the processing software produced the result?\r\n\r\nTo evaluate or reproduce the analysis, we need answers to those questions.\r\n\r\nThis is the problem we want to address: not simply producing a number, but preserving the evidence behind it.\r\n\r\nThese distinctions matter when results are compared across laboratories or studies.'}, {'number': 3, 'scene_id': 'eh26-scene-03', 'target_seconds': 65, 'word_count': 118, 'voiceover_v1': 'First, a brief look at the measurement.\r\n\r\nIn our TED-GC-MS configuration, the sample is heated under controlled conditions. Organic compounds are released, and polymers can decompose into characteristic products.\r\n\r\nPart of the evolved gas stream passes a sorptive device, shown here as a Twister.\r\n\r\nThe loaded sorbent is transferred to a thermal desorption system. The collected substances are released, focused at low temperature, separated by gas chromatography, and detected by mass spectrometry.\r\n\r\nThe mass spectrometer observes ions formed from the separated substances, rather than intact polymer particles.\r\n\r\nThese signals are then interpreted through characteristic markers and calibration measurements.\r\n\r\nThe approach is therefore mass-based: it can provide information about polymer-related mass, but not individual particle counts, shapes, or sizes.'}, {'number': 4, 'scene_id': 'eh26-scene-04', 'target_seconds': 75, 'word_count': 119, 'voiceover_v1': 'The instrument does not produce a table of polymer concentrations. It produces ion signals over time.\r\n\r\nA total-ion chromatogram summarizes the detected signal, but a useful interpretation often begins with individual extracted-ion chromatograms.\r\n\r\nWe search for characteristic decomposition products and examine their retention behavior and mass-spectral information.\r\n\r\nHere, one signal becomes a candidate marker.\r\n\r\nHowever, environmental matrices are complex, peaks may overlap, and different substances may contribute to similar signals.\r\n\r\nSo a peak is not automatically proof of a polymer.\r\n\r\nBefore we calculate concentrations, we need a reproducible way to locate relevant signals, associate them with components, and select markers according to an explicit analytical method.\r\n\r\nThe choice of ion trace and integration region also affects the reported mass.'}, {'number': 5, 'scene_id': 'eh26-scene-05', 'target_seconds': 85, 'word_count': 137, 'voiceover_v1': 'This is our processing chain.\r\n\r\nWe first import the instrument data and extract ion chromatograms.\r\n\r\nNext, peak detection turns continuous signals into a list of chromatographic features.\r\n\r\nJoint fitting then combines features that share an elution profile into components.\r\n\r\nWe select components associated with polymer markers, estimate marker areas, and use external calibration to calculate polymer-related mass.\r\n\r\nFinally, we normalize that mass to the sample mass where appropriate.\r\n\r\nEvery arrow represents more than a file transfer.\r\n\r\nIt represents a scientific decision: a peak model, a fitting rule, a marker definition, or a calibration choice.\r\n\r\nThose decisions are exactly what a transparent processing pipeline must preserve.\r\n\r\nEach operation receives an input, applies a defined transformation, and produces an output.\r\n\r\nDocumenting these boundaries lets us inspect, validate, and potentially replace implementations without losing the scientific meaning of the workflow.'}, {'number': 6, 'scene_id': 'eh26-scene-06', 'target_seconds': 75, 'word_count': 127, 'voiceover_v1': 'For peak detection, we use our qPeaks approach.\r\n\r\nInstead of relying on a single fixed peak width, the algorithm examines each extracted-ion chromatogram with moving regression windows at several scales.\r\n\r\nPotential peaks are described using a local asymmetric model, and suitable candidates can then be evaluated further.\r\n\r\nIn a second step, signals across different ion traces can be fitted together when they share a chromatographic elution profile.\r\n\r\nThis helps organize many individual features into meaningful components.\r\n\r\nBut automation does not remove the responsibility to evaluate them.\r\n\r\nWindow sizes, fitting settings, acceptance criteria, and marker assignments must remain explicit, because different choices can change which features enter the final calculation.\r\n\r\nSeveral ion traces may contain the same chromatographic peak, but at different intensities; joint analysis preserves this relationship.'}, {'number': 7, 'scene_id': 'eh26-scene-07', 'target_seconds': 100, 'word_count': 173, 'voiceover_v1': "Calibration is another part of data processing that deserves attention.\r\n\r\nA conventional calibration may involve a substantial number of standards and blank measurements, making it time-consuming in a long analytical campaign.\r\n\r\nOur working concept is running calibration: maintain a set of fifteen standards, add a newly measured standard, and remove the oldest one.\r\n\r\nThis is a first-in, first-out, or FIFO, window.\r\n\r\nThe idea is to use calibration information close to the time of a sample rather than treating calibration as a separate event at the beginning of a campaign.\r\n\r\nThe existing demonstration replays forty-four SBR calibration measurements in a balanced order and updates the fitted line as the window moves.\r\n\r\nIt illustrates the procedure, but does not independently establish long-term performance or optimal window size.\r\n\r\nDrift, blank measurements, quality control, and calibration validity still have to be assessed.\r\n\r\nThe key point for our topic is that the selected calibration window is itself part of the result's provenance.\r\n\r\nA moving window is not automatically a valid drift correction or a substitute for quality control."}, {'number': 8, 'scene_id': 'eh26-scene-08', 'target_seconds': 80, 'word_count': 138, 'voiceover_v1': "Let us return to the samples.\r\n\r\nWe use a local linear calibration fitted to fifteen standards to convert each replicate's marker area into an estimated SBR mass.\r\n\r\nWe then normalize by the amount of sample analyzed.\r\n\r\nFor the example shown, the influent has a mean of approximately fifteen point seven micrograms of SBR per milligram of sample.\r\n\r\nThe effluent has approximately thirteen point six.\r\n\r\nEach mean is based on three normalized replicate results.\r\n\r\nThe error bars represent descriptive standard errors, not a complete uncertainty assessment.\r\n\r\nThese two numbers should not be interpreted as proof of a treatment effect.\r\n\r\nMy main point is different: the reported result depends on the exact marker area, local calibration model, normalization and processing choices.\r\n\r\nAll of them must remain traceable.\r\n\r\nThe sample and calibration identifiers must therefore remain linked to the reported results."}, {'number': 9, 'scene_id': 'eh26-scene-09', 'target_seconds': 100, 'word_count': 167, 'voiceover_v1': "This brings us to FAIR: Findable, Accessible, Interoperable, and Reusable.\r\n\r\nFAIR is often discussed as a property of a final dataset. In analytical chemistry, we need to think about the entire processing history.\r\n\r\nA result should point to its input file, the selected ion traces, extracted features, chosen polymer marker, calibration data, processing parameters, and software version.\r\n\r\nDescribing these relations in a shared, machine-readable vocabulary gives each step an explicit meaning.\r\n\r\nAnother tool can distinguish a marker area from a polymer mass, or a parameter from a measured value.\r\n\r\nThis supports interoperability and reuse.\r\n\r\nBut a structured file alone is not enough to make data FAIR.\r\n\r\nPersistent identifiers, discovery, appropriate access, provenance, licenses, and community standards also matter.\r\n\r\nFAIR does not necessarily mean that every file is openly accessible.\r\n\r\nThe practical goal is simple: preserve the context needed to understand and reuse the result without relying on the original analyst's memory.\r\n\r\nRDF-based descriptions can link scientific objects across software boundaries, alongside the numerical results and their provenance."}, {'number': 10, 'scene_id': 'eh26-scene-10', 'target_seconds': 90, 'word_count': 150, 'voiceover_v1': 'A machine-readable pipeline offers another advantage: we can check whether its steps are structurally compatible.\r\n\r\nConsider a simple example.\r\n\r\nOne processing step produces a vector of detected peaks. The following step is initially declared to accept a single integer.\r\n\r\nThe connection looks plausible in a diagram, but the declared interfaces do not match.\r\n\r\nUsing SHACL, a language for validating RDF descriptions against explicit constraints, we can detect that mismatch and obtain a validation report.\r\n\r\nAfter correcting the expected input to a peak vector, the same selected check passes.\r\n\r\nWe also record the revision and its validation evidence.\r\n\r\nThis tested teaching example demonstrates an interface check, not proof that the algorithm is scientifically correct or will execute successfully.\r\n\r\nNevertheless, it allows us to identify certain workflow errors before running the full analysis.\r\n\r\nThat is a concrete benefit of transparent semantics.\r\n\r\nReal interface contracts also need units, data structures, and required parameters.'}, {'number': 11, 'scene_id': 'eh26-scene-11', 'target_seconds': 70, 'word_count': 119, 'voiceover_v1': 'Finally, the same explicit descriptions can support controlled automation.\r\n\r\nImagine that a TED-GC-MS measurement has finished and its data file is complete.\r\n\r\nA readiness event can trigger an execution engine.\r\n\r\nThe engine follows the defined pipeline, runs the appropriate processing steps, and produces a report linked to its inputs, parameters, calibration and software versions.\r\n\r\nThe report can then be registered and stored.\r\n\r\nOur processing engine and semantically described pipelines already exist, while the fully integrated event-driven system is still under development.\r\n\r\nSo this diagram is an architecture and development direction, not a claim of a fully deployed autonomous laboratory.\r\n\r\nThe important distinction is between automating a sequence of computations and automating a process whose decisions can still be inspected.'}, {'number': 12, 'scene_id': 'eh26-scene-12', 'target_seconds': 35, 'word_count': 60, 'voiceover_v1': 'To conclude, TED-GC-MS provides valuable chemical information for mass-based microplastics analysis.\r\n\r\nAutomated processing helps us turn signals into results, but speed alone is not enough.\r\n\r\nWe also need traceable calibration, explicit processing steps, and checkable interfaces.\r\n\r\nThe goal is not to hide analytical decisions inside software.\r\n\r\nIt is to make them visible, checkable, and reusable.\r\n\r\nThank you for your attention.'}]
FLOW_LABELS = ('Instrument Data', 'EICs', 'Peak Detection', 'Component Fitting', 'Marker Selection', 'Calibration', 'Polymer Mass')

class EnvironmentalHealth2026Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = Dataset(default_union=True)
        for filename in sorted((ROOT / 'ontology/dataset').glob('*.trig')):
            if filename != NEW_FILE:
                cls.dataset.parse(filename, format='trig')
        cls.old_reference = R.CoursePathReference(str(OLD_PATH), str(OLD_GRAPH))
        cls.legacy_before = R.compile_scene_document(cls.dataset, cls.old_reference)
        cls.legacy_quads = set(cls.dataset.graph(OLD_GRAPH))
        cls.legacy_step_ids = set(cls.dataset.graph(OLD_GRAPH).objects(OLD_PATH, CD.hasStep))
        cls.dataset.parse(NEW_FILE, format='trig')
        cls.legacy_after = R.compile_scene_document(cls.dataset, cls.old_reference)
        cls.reference = R.CoursePathReference(str(PATH), str(NEW_GRAPH))
        cls.document = R.compile_scene_document(cls.dataset, cls.reference)
        cls.pg = cls.dataset.graph(NEW_GRAPH)
        cls.steps = sorted(cls.pg.objects(PATH, CD.hasStep), key=lambda s: int(cls.pg.value(s, CD.position)))

    def test_twelve_independent_ordered_scenes_and_resources(self):
        self.assertEqual(len(self.steps), 12)
        self.assertEqual([int(self.pg.value(s, CD.position)) for s in self.steps], list(range(1, 13)))
        self.assertEqual(set(self.steps), {EX[f'eh26-step-{i:02d}'] for i in range(1, 13)})
        self.assertFalse(set(self.steps) & self.legacy_step_ids)
        scene_ids = []
        topics = set(self.pg.objects(PATH, CD.forTopic))
        for i, step in enumerate(self.steps, 1):
            chosen = list(self.pg.objects(step, CD.usesScene))
            self.assertEqual(chosen, [EX[f'eh26-scene-{i:02d}']])
            scene = chosen[0]
            scene_ids.append(scene)
            self.assertIn((scene, RDF.type, CD.SceneDefinition), self.dataset)
            focus = self.dataset.value(scene, CD.focusConcept)
            self.assertIn(focus, topics)
            self.assertIn((focus, RDF.type, CD.Concept), self.dataset)
            resources = set(self.pg.objects(step, CD.usesResource))
            items = list(self.dataset.objects(scene, CD.hasSceneItem))
            self.assertEqual(len(items), 3)
            self.assertEqual(sorted(int(self.dataset.value(item, CD.position)) for item in items), [1, 2, 3])
            for item in items:
                self.assertIn(self.dataset.value(item, CD.selectsResource), resources)
            heading_items = [item for item in items if self.dataset.value(item, CD.communicativeRole) == CD.HeadingRole]
            self.assertEqual(len(heading_items), 1)
            item = heading_items[0]
            self.assertEqual(str(self.dataset.value(item, CD.selectionPath)), 'skos:prefLabel@en')
            heading = self.dataset.value(item, CD.selectsResource)
            self.assertTrue(any(value.language == 'en' for value in self.dataset.objects(heading, SKOS.prefLabel)))
        self.assertEqual(len(set(scene_ids)), 12)
        self.assertFalse(any(self.dataset.objects(scene_ids[0], CD.presentationTitleOf)))
        owners = [g for s, p, o, g in self.dataset.quads((PATH, RDF.type, CD.LearningPath, None))]
        self.assertEqual(owners, [NEW_GRAPH])

    def test_actual_compiler_and_legacy_projection(self):
        self.assertIsNotNone(self.document)
        self.assertEqual(len(self.document['scenes']), 12)
        self.assertEqual(
            [scene['source'][0]['resourceId'] for scene in self.document['scenes']],
            [f'ex:eh26-scene-{i:02d}' for i in range(1, 13)],
        )
        self.assertEqual(len(self.legacy_step_ids), 29)
        self.assertEqual(set(self.dataset.graph(OLD_GRAPH)), self.legacy_quads)
        self.assertEqual(self.legacy_after, self.legacy_before)
        # Compare real compiler documents, not guessed runtime scene fields.
        # Exact path isolation is also checked directly against the authored graph.
        self.assertNotEqual(self.document, self.legacy_after)
        self.assertFalse(any(str(s).startswith(str(EX) + 'ted-step-') for s in self.steps))

    def test_narration_and_production_timing(self):
        expected = EXPECTED_RECORDS
        self.assertEqual(sum(record['target_seconds'] for record in expected), 870)
        storyboard = (ROOT / 'docs/talks/environmental-health-2026/storyboard.md').read_text(encoding='utf-8')
        rows = re.findall(r'^\| eh26-scene-(\d{2}) \| [^|]+ \| [^|]+ \| (\d+) \|', storyboard, re.M)
        self.assertEqual(rows, [(f'{i:02d}', str(record['target_seconds'])) for i, record in enumerate(expected, 1)])
        transcript = (ROOT / 'docs/talks/environmental-health-2026/transcript.en.txt').read_text(encoding='utf-8')
        manuscript = (ROOT / 'docs/talks/environmental-health-2026/manuscript-v1.md').read_text(encoding='utf-8')
        for i, record in enumerate(expected, 1):
            values = list(self.dataset.objects(EX[f'eh26-scene-{i:02d}'], CD.narration))
            self.assertEqual(values, [Literal(record['voiceover_v1'].replace('\r\n', '\n'), lang='en')])
            text = str(values[0])
            self.assertNotIn('cogniflow', text.lower())
            self.assertNotIn(chr(0x2014), text)
            self.assertIn(text.replace('\r\n', '\n'), transcript)
            self.assertIn(text.replace('\r\n', '\n'), manuscript)
        for graph in self.dataset.graphs():
            for subject, predicate, value in graph:
                if str(subject).startswith(str(EX) + 'eh26-') and isinstance(value, Literal):
                    self.assertNotIn(chr(0x2014), str(value))
                    self.assertNotIn('cogniflow', str(value).lower())
        self.assertNotRegex(transcript, r'\d{2}:\d{2}:\d{2}[,.]\d{3}')

    def test_static_fifo_and_same_calibration_pairs(self):
        chart = EX['eh26-fifo-chart']
        self.assertEqual(set(self.dataset.objects(chart, CD.usesDataset)), {EX['ted-calibration-pairs']})
        self.assertEqual(len(set(self.dataset.objects(EX['ted-calibration-pairs'], CD.hasObservation))), 44)
        windows = sorted(self.dataset.objects(chart, CD.hasRegressionWindow), key=lambda w: int(self.dataset.value(w, CD.position)))
        self.assertEqual(windows, [EX[f'eh26-fifo-window-{i}'] for i in range(1, 4)])
        memberships = []
        for i, window in enumerate(windows, 1):
            members = set(self.dataset.objects(window, CD.hasObservation))
            self.assertEqual(members, {EX[f'ted-cal-{j:02d}'] for j in range(i, i + 15)})
            memberships.append(members)
            self.assertFalse(list(self.dataset.objects(window, CD.cycleIntervalMs)))
        self.assertFalse(list(self.dataset.objects(chart, CD.cycleIntervalMs)))
        self.assertNotIn(EX['ted-cal-window-shift'], windows)
        for left, right in zip(memberships, memberships[1:]):
            self.assertEqual(len(left - right), 1)
            self.assertEqual(len(right - left), 1)
            self.assertEqual(len(left & right), 14)
        excluded = {RDF.type, SKOS.prefLabel, CD.body, CD.hasRegressionWindow, CD.cycleIntervalMs, CD.authoredResource}
        for predicate, value in self.dataset.predicate_objects(EX['ted-running-regression-chart']):
            if predicate not in excluded:
                self.assertIn((chart, predicate, value), self.dataset)

    def test_reused_sbr_data_and_no_ensemble_selection(self):
        for number in (1, 2, 8):
            resources = set(self.pg.objects(EX[f'eh26-step-{number:02d}'], CD.usesResource))
            self.assertIn(EX['ted-sample-comparison-chart'], resources)
            self.assertNotIn(EX['ted-in-ensemble-data'], resources)
            self.assertNotIn(EX['ted-out-ensemble-data'], resources)
        groups = set(self.dataset.objects(EX['ted-sample-comparison-chart'], CD.hasChartGroup))
        self.assertEqual(groups, {EX['ted-sample-in-local-group'], EX['ted-sample-out-local-group']})
        for group, dataset_id, mean_id, expected in (
            ('ted-sample-in-local-group', 'ted-in-local-data', 'ted-in-local-mean', 15.687291305338027),
            ('ted-sample-out-local-group', 'ted-out-local-data', 'ted-out-local-mean', 13.649277025894788),
        ):
            self.assertEqual(set(self.dataset.objects(EX[group], CD.usesDataset)), {EX[dataset_id]})
            self.assertEqual(len(set(self.dataset.objects(EX[dataset_id], CD.hasObservation))), 3)
            self.assertAlmostEqual(float(self.dataset.value(EX[mean_id], CD.numericValue)), expected, places=10)
        for identifier in ('ted-in-input', 'ted-out-input'):
            self.assertEqual(int(self.dataset.value(EX[identifier], CD.calibrationWindowSize)), 15)

    def test_flows_reprise_parts_and_nonempty_entry(self):
        for identifier in ('eh26-processing-flow', 'eh26-semantic-processing-flow'):
            flow = EX[identifier]
            nodes = sorted(self.dataset.objects(flow, CD.hasDiagramNode), key=lambda n: int(self.dataset.value(n, CD.position)))
            self.assertEqual([str(self.dataset.value(n, SKOS.prefLabel)) for n in nodes], list(FLOW_LABELS))
            self.assertEqual(len(list(self.dataset.objects(flow, CD.hasDiagramEdge))), 6)
            states = sorted(self.dataset.objects(flow, CD.hasDiagramState), key=lambda s: int(self.dataset.value(s, CD.position)))
            self.assertEqual(len(states), 5)
            self.assertEqual([len(set(self.dataset.objects(s, CD.activeDiagramNode))) for s in states], [2, 3, 4, 5, 7])
            self.assertEqual(set(self.dataset.objects(states[-1], CD.activeDiagramNode)), set(nodes))
            if 'semantic' in identifier:
                expected_bodies = (
                    'Input identity: File ID, sample ID and import version',
                    'Signal meaning: Ion channel, time and intensity units',
                    'Detection settings: Window sizes, model and acceptance rules',
                    'Component provenance: Feature IDs, shared profile and fit version',
                    'Marker meaning: Component ID, polymer assignment and area units',
                    'Calibration identity: Standard IDs, selected window and model revision',
                    'Result context: Sample mass, units, result ID and linked history',
                )
                for number, (node, expected_body) in enumerate(zip(nodes, expected_bodies), 1):
                    self.assertEqual(node, EX[f'eh26-semantic-processing-flow-node-{number}'])
                    self.assertEqual(
                        list(self.dataset.objects(node, CD.body)),
                        [Literal(expected_body, lang='en')],
                    )
                    self.assertEqual(list(self.dataset.objects(node, CD.hasDiagramNodePart)), [])
                    orphan = EX[f'eh26-semantic-processing-flow-part-{number}']
                    self.assertEqual(list(self.dataset.predicate_objects(orphan)), [])
                    self.assertEqual(list(self.dataset.subject_predicates(orphan)), [])
        for number in (5, 12):
            self.assertIn(EX['eh26-processing-flow'], set(self.pg.objects(EX[f'eh26-step-{number:02d}'], CD.usesResource)))
        self.assertIn(EX['eh26-semantic-processing-flow'], set(self.pg.objects(EX['eh26-step-09'], CD.usesResource)))
        self.assertIn(EX['ted-validation-flow'], set(self.pg.objects(EX['eh26-step-10'], CD.usesResource)))
        self.assertEqual(set(self.dataset.objects(EX['ted-validation-flow'], CD.hasDiagramState)), {EX['ted-validation-bad'], EX['ted-validation-good']})
        automation = EX['eh26-controlled-automation-flow']
        first = min(self.dataset.objects(automation, CD.hasDiagramState), key=lambda s: int(self.dataset.value(s, CD.position)))
        self.assertTrue(list(self.dataset.objects(first, CD.activeDiagramNode)))
        self.assertIn('In development', str(self.dataset.value(EX['eh26-statement-11'], CD.body)))

    def test_no_unsafe_autoplay_or_old_scene_leak(self):
        # Follow only rendered visual structures, not scientific source closures.
        predicates = (CD.hasDiagramNode, CD.hasDiagramEdge, CD.hasDiagramState,
            CD.hasDiagramNodePart, CD.hasNodePresentation, CD.usesThumbnail,
            CD.hasRegressionWindow, CD.hasChartGroup)
        pending = []
        for step in self.steps:
            pending.extend(self.pg.objects(step, CD.usesResource))
        seen = set()
        while pending:
            resource = pending.pop()
            if resource in seen:
                continue
            seen.add(resource)
            self.assertFalse(list(self.dataset.objects(resource, CD.cycleIntervalMs)))
            for value in self.dataset.objects(resource, CD.mediaType):
                self.assertFalse(str(value).startswith(('video/', 'audio/')))
            for predicate, value in self.dataset.predicate_objects(resource):
                name = str(predicate).rsplit('/', 1)[-1].lower()
                if name in ('autoplay', 'autoslide', 'cycleintervalms'):
                    self.assertIn(str(value).lower(), ('false', '0'))
            for predicate in predicates:
                pending.extend(self.dataset.objects(resource, predicate))
        self.assertNotIn(EX['ted-cal-window-shift'], seen)
        self.assertNotIn(EX['ted-demo-one'], seen)
        self.assertNotIn(EX['ted-demo-two'], seen)
        for step in self.steps:
            self.assertNotIn(self.pg.value(step, CD.usesScene), {EX['ted-scene-demo-one'], EX['ted-scene-demo-two']})

if __name__ == '__main__':
    unittest.main()
