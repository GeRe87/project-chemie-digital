#!/usr/bin/env python3
"""Generate deterministic browser/runtime artifacts from the canonical TriG Dataset.

The generated JSON is disposable transport. Audience-visible content remains authored
only in ``ontology/dataset/*.trig``.
"""
from __future__ import annotations

import argparse
import html
import json
import math
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable

from rdflib import DCTERMS, RDF, SKOS, Dataset, Literal, URIRef

from course_path_selection import (
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)
from rdf_dataset import assemble_dataset, dataset_fingerprint
from teaching_offering_runtime import project_teaching_offering_runtime_document

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "apps" / "pitch" / "src" / "generated" / "canonical-runtime.json"
PITCH_INDEX = ROOT / "apps" / "pitch" / "index.html"
CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
SCHEMA = "https://schema.org/"

DEFAULT_OFFERING_ID = f"{EX}teaching-offering-digital-chemistry"
DEFAULT_PLACEMENT_ID = f"{EX}unit-placement-standard-deviation"
DEFAULT_UNIT_ID = f"{EX}learning-unit-standard-deviation"


def iri(namespace: str, local: str) -> URIRef:
    return URIRef(namespace + local)


def compact(value: URIRef | str) -> str:
    text = str(value)
    for namespace, prefix in ((EX, "ex:"), (CD, "cd:"), (str(SKOS), "skos:"), (str(DCTERMS), "dct:"), (SCHEMA, "schema:")):
        if text.startswith(namespace):
            return prefix + text[len(namespace) :]
    return text


def local_name(value: URIRef | str) -> str:
    text = str(value)
    return text.rsplit("/", 1)[-1].rsplit("#", 1)[-1].replace("-", " ")


def normalize_newlines(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def quads(dataset: Dataset, subject: URIRef | None = None, predicate: URIRef | None = None) -> Iterable[tuple[Any, Any, Any, Any]]:
    return dataset.quads((subject, predicate, None, None))


def objects(dataset: Dataset, subject: URIRef, predicate: URIRef) -> list[Any]:
    return sorted({obj for _s, _p, obj, _g in quads(dataset, subject, predicate)}, key=lambda value: value.n3())


def one(dataset: Dataset, subject: URIRef, predicate: URIRef, *, required: bool = True) -> Any | None:
    values = objects(dataset, subject, predicate)
    if not values:
        if required:
            raise ValueError(f"Missing {compact(predicate)} for {compact(subject)}")
        return None
    if len(values) != 1:
        raise ValueError(f"Expected one {compact(predicate)} for {compact(subject)}, got {len(values)}")
    return values[0]


def graph_ids(dataset: Dataset, subject: URIRef) -> list[str]:
    return sorted({str(graph) for _s, _p, _o, graph in quads(dataset, subject, None)})


def literal(dataset: Dataset, subject: URIRef, predicate: URIRef, language: str | None = None) -> str | None:
    values = [value for value in objects(dataset, subject, predicate) if isinstance(value, Literal)]
    if language is not None:
        values = [value for value in values if value.language == language]
    if not values:
        return None
    if len(values) > 1:
        raise ValueError(f"Ambiguous literal {compact(predicate)} for {compact(subject)}")
    return normalize_newlines(str(values[0]))


def deterministic_authored_literal(
    dataset: Dataset,
    subject: URIRef,
    predicate: URIRef,
    preferred_language: str | None = None,
) -> str | None:
    if preferred_language is not None:
        preferred = literal(dataset, subject, predicate, preferred_language)
        if preferred is not None:
            return preferred
    values = [value for value in objects(dataset, subject, predicate) if isinstance(value, Literal)]
    if not values:
        return None
    values.sort(key=lambda value: (value.language or "", str(value.datatype or ""), str(value), value.n3()))
    return normalize_newlines(str(values[0]))


def boolean_literal(dataset: Dataset, subject: URIRef, predicate: URIRef) -> bool:
    value = literal(dataset, subject, predicate)
    if value == "true":
        return True
    if value == "false":
        return False
    raise ValueError(f"Invalid boolean {compact(predicate)} for {compact(subject)}")


def resource_text(dataset: Dataset, resource: URIRef, language: str | None) -> str:
    candidates = (
        iri(CD, "body"), iri(CD, "latex"), iri(CD, "expression"), iri(CD, "notation"),
        DCTERMS.description, SKOS.prefLabel, DCTERMS.title, iri(SCHEMA, "name"),
    )
    for predicate in candidates:
        selected_language = language if predicate in {iri(CD, "body"), DCTERMS.description, SKOS.prefLabel} else None
        value = literal(dataset, resource, predicate, selected_language)
        if value is not None:
            return value
    raise ValueError(f"No audience-visible value for {compact(resource)}")


def source_reference(dataset: Dataset, resource: URIRef, relation_path: str | None = None) -> dict[str, Any]:
    value: dict[str, Any] = {"resourceId": compact(resource)}
    provenance = graph_ids(dataset, resource)
    if provenance:
        value["provenanceIds"] = provenance
    if relation_path:
        value["relationPath"] = relation_path
    return value


def integer(dataset: Dataset, subject: URIRef, predicate: URIRef) -> int:
    value = one(dataset, subject, predicate)
    try:
        result = int(str(value))
    except (TypeError, ValueError) as error:
        raise ValueError(f"Invalid integer {compact(predicate)} for {compact(subject)}") from error
    if result < 1:
        raise ValueError(f"Position must be positive for {compact(subject)}")
    return result


def is_resource_type(dataset: Dataset, resource: URIRef, type_name: str) -> bool:
    return any(obj == iri(CD, type_name) for obj in objects(dataset, resource, RDF.type))


def selected_literal(
    dataset: Dataset,
    resource: URIRef,
    predicate: URIRef,
    selector: str,
    language: str | None = None,
) -> str:
    value = literal(dataset, resource, predicate, language)
    if value is None:
        raise ValueError(f"Missing selected value {selector} for {compact(resource)}")
    return value


def keypoint_sequence(dataset: Dataset, owner: URIRef, language: str | None) -> list[tuple[URIRef, int, str]]:
    predicate = iri(CD, "hasKeyPoint")
    linked = [value for value in objects(dataset, owner, predicate) if isinstance(value, URIRef)]
    if not linked:
        raise ValueError(f"KeyPointRole requires linked KeyPoints for {compact(owner)}")
    records: list[tuple[URIRef, int, str]] = []
    seen_positions: set[int] = set()
    for point in linked:
        if not is_resource_type(dataset, point, "KeyPoint"):
            raise ValueError(f"Linked resource {compact(point)} is not a KeyPoint")
        owners = sorted(
            {
                subject
                for subject, _predicate, _object, _graph in dataset.quads((None, predicate, point, None))
                if isinstance(subject, URIRef)
            },
            key=str,
        )
        if owners != [owner]:
            raise ValueError(f"KeyPoint {compact(point)} must have exactly one owning LearningResource")
        position = integer(dataset, point, iri(CD, "position"))
        if position in seen_positions:
            raise ValueError(f"KeyPoint positions must be unique for {compact(owner)}")
        seen_positions.add(position)
        text = selected_literal(dataset, point, iri(CD, "body"), "cd:body", language)
        records.append((point, position, text))
    records.sort(key=lambda record: (record[1], str(record[0])))
    positions = [position for _point, position, _text in records]
    if positions != list(range(1, len(records) + 1)):
        raise ValueError(f"KeyPoint positions must be contiguous for {compact(owner)}")
    return records


def selected_label_reference(dataset: Dataset, resource: URIRef, language: str | None) -> tuple[str, str | None]:
    if language is not None:
        preferred = literal(dataset, resource, SKOS.prefLabel, language)
        if preferred is not None:
            return preferred, f"skos:prefLabel@{language}"
    for predicate, relation_path in (
        (DCTERMS.title, "dct:title"),
        (iri(SCHEMA, "name"), "schema:name"),
    ):
        fallback = deterministic_authored_literal(dataset, resource, predicate)
        if fallback is not None:
            return fallback, relation_path
    return local_name(resource), None


def flow_diagram_payload(dataset: Dataset, diagram: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    node_records = [
        (node, integer(dataset, node, iri(CD, "position")))
        for node in objects(dataset, diagram, iri(CD, "hasDiagramNode"))
        if isinstance(node, URIRef)
    ]
    edge_records = [
        (edge, integer(dataset, edge, iri(CD, "position")))
        for edge in objects(dataset, diagram, iri(CD, "hasDiagramEdge"))
        if isinstance(edge, URIRef)
    ]
    node_records.sort(key=lambda record: (record[1], str(record[0])))
    edge_records.sort(key=lambda record: (record[1], str(record[0])))
    if len(node_records) < 2:
        raise ValueError(f"FlowDiagram {compact(diagram)} requires at least two DiagramNodes")
    if not edge_records:
        raise ValueError(f"FlowDiagram {compact(diagram)} requires at least one DiagramEdge")
    node_positions = [position for _node, position in node_records]
    if node_positions != list(range(1, len(node_records) + 1)):
        raise ValueError(f"DiagramNode positions must be unique and contiguous for {compact(diagram)}")
    edge_positions = [position for _edge, position in edge_records]
    if edge_positions != list(range(1, len(edge_records) + 1)):
        raise ValueError(f"DiagramEdge positions must be unique and contiguous for {compact(diagram)}")

    node_ids = {node for node, _position in node_records}
    focus_node = one(dataset, diagram, iri(CD, "focusNode"), required=False)
    if focus_node is not None and focus_node not in node_ids:
        raise ValueError(f"FlowDiagram focusNode {compact(focus_node)} is outside {compact(diagram)}")

    nodes: list[dict[str, Any]] = []
    for node, _position in node_records:
        label, relation_path = selected_label_reference(dataset, node, language)
        node_value: dict[str, Any] = {
            "id": compact(node),
            "label": label,
            "source": [source_reference(dataset, node, relation_path)],
        }
        if node == focus_node:
            node_value["emphasis"] = "primary"
        nodes.append(node_value)

    edges: list[dict[str, Any]] = []
    for edge, _position in edge_records:
        source_node = one(dataset, edge, iri(CD, "sourceNode"))
        target_node = one(dataset, edge, iri(CD, "targetNode"))
        if source_node not in node_ids or target_node not in node_ids:
            raise ValueError(f"FlowDiagram edge {compact(edge)} references a node outside {compact(diagram)}")
        label, relation_path = selected_label_reference(dataset, edge, language)
        edges.append({
            "id": compact(edge),
            "sourceNodeId": compact(source_node),
            "targetNodeId": compact(target_node),
            "label": label,
            "source": [source_reference(dataset, edge, relation_path)],
        })

    label, label_relation_path = selected_label_reference(dataset, diagram, language)
    payload: dict[str, Any] = {
        "diagramType": "flow",
        "label": label,
        "description": selected_literal(dataset, diagram, iri(CD, "body"), "cd:body", language),
        "nodes": nodes,
        "edges": edges,
    }
    if focus_node is not None:
        payload["focusNodeId"] = compact(focus_node)
    return payload, label_relation_path


def decimal_number(dataset: Dataset, subject: URIRef, predicate: URIRef) -> float:
    value = one(dataset, subject, predicate)
    try:
        decimal_value = Decimal(str(value))
        result = float(decimal_value)
    except (InvalidOperation, ValueError, TypeError, OverflowError) as error:
        raise ValueError(f"Invalid decimal {compact(predicate)} for {compact(subject)}") from error
    if not math.isfinite(result):
        raise ValueError(f"Non-finite decimal {compact(predicate)} for {compact(subject)}")
    return result


def bar_chart_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    chart_type = one(dataset, chart, iri(CD, "chartType"))
    if chart_type != iri(CD, "BarChart"):
        raise ValueError(f"Unsupported chart type for {compact(chart)}: {compact(chart_type)}")

    chart_dataset = one(dataset, chart, iri(CD, "usesDataset"))
    if not isinstance(chart_dataset, URIRef) or not is_resource_type(dataset, chart_dataset, "Dataset"):
        raise ValueError(f"ChartDefinition {compact(chart)} requires exactly one Dataset")

    observations = [
        (observation, integer(dataset, observation, iri(CD, "position")))
        for observation in objects(dataset, chart_dataset, iri(CD, "hasObservation"))
        if isinstance(observation, URIRef)
    ]
    observations.sort(key=lambda record: (record[1], str(record[0])))
    if not observations:
        raise ValueError(f"Chart dataset {compact(chart_dataset)} requires at least one Observation")
    positions = [position for _observation, position in observations]
    if positions != list(range(1, len(observations) + 1)):
        raise ValueError(f"Chart observation positions must be unique and contiguous for {compact(chart_dataset)}")

    data: list[dict[str, Any]] = []
    for observation, _position in observations:
        category, relation_path = selected_label_reference(dataset, observation, language)
        data.append({
            "id": compact(observation),
            "category": category,
            "value": decimal_number(dataset, observation, iri(CD, "numericValue")),
            "source": [
                source_reference(dataset, observation, relation_path),
                source_reference(dataset, observation, "cd:numericValue"),
            ],
        })

    label, label_relation_path = selected_label_reference(dataset, chart, language)
    x_axis_label = selected_literal(dataset, chart, iri(CD, "xAxisLabel"), "cd:xAxisLabel", language)
    y_axis_label = selected_literal(dataset, chart, iri(CD, "yAxisLabel"), "cd:yAxisLabel", language)
    unit = literal(dataset, chart_dataset, iri(CD, "unit"))

    payload: dict[str, Any] = {
        "chartType": "bar",
        "label": label,
        "description": selected_literal(dataset, chart, iri(CD, "body"), "cd:body", language),
        "xAxis": {"label": x_axis_label, **({"unit": literal(dataset, chart, iri(CD, "xAxisUnit"))} if literal(dataset, chart, iri(CD, "xAxisUnit")) else {})},
        "yAxis": {"label": y_axis_label, **({"unit": literal(dataset, chart, iri(CD, "yAxisUnit")) or unit} if (literal(dataset, chart, iri(CD, "yAxisUnit")) or unit) else {})},
        "data": data,
    }
    return payload, label_relation_path



def line_chart_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    chart_dataset = one(dataset, chart, iri(CD, "usesDataset"))
    if not isinstance(chart_dataset, URIRef) or not is_resource_type(dataset, chart_dataset, "Dataset"):
        raise ValueError(f"ChartDefinition {compact(chart)} requires exactly one Dataset")

    observation_records = [
        (observation, integer(dataset, observation, iri(CD, "position")))
        for observation in objects(dataset, chart_dataset, iri(CD, "hasObservation"))
        if isinstance(observation, URIRef)
    ]
    observation_records.sort(key=lambda record: (record[1], str(record[0])))
    if len(observation_records) < 2:
        raise ValueError(f"Line-chart dataset {compact(chart_dataset)} requires at least two observations")
    positions = [position for _observation, position in observation_records]
    if positions != list(range(1, len(observation_records) + 1)):
        raise ValueError(f"Line-chart observation positions must be unique and contiguous for {compact(chart_dataset)}")

    data: list[dict[str, Any]] = []
    observation_ids: set[URIRef] = set()
    previous_x: float | None = None
    for observation, _position in observation_records:
        observation_ids.add(observation)
        x_value = decimal_number(dataset, observation, iri(CD, "xValue"))
        y_value = decimal_number(dataset, observation, iri(CD, "numericValue"))
        if previous_x is not None and x_value <= previous_x:
            raise ValueError(f"Line-chart x-values must be strictly increasing for {compact(chart_dataset)}")
        previous_x = x_value
        data.append({
            "id": compact(observation),
            "x": x_value,
            "y": y_value,
            "source": [
                source_reference(dataset, observation, "cd:xValue"),
                source_reference(dataset, observation, "cd:numericValue"),
            ],
        })

    series_label, series_label_path = selected_label_reference(dataset, chart_dataset, language)
    series_id = compact(chart_dataset)
    annotation_records = [
        (annotation, integer(dataset, annotation, iri(CD, "position")))
        for annotation in objects(dataset, chart, iri(CD, "hasChartAnnotation"))
        if isinstance(annotation, URIRef)
    ]
    annotation_records.sort(key=lambda record: (record[1], str(record[0])))
    annotations: list[dict[str, Any]] = []
    for annotation, _position in annotation_records:
        base = {
            "id": compact(annotation),
            "seriesId": series_id,
            "label": selected_literal(dataset, annotation, iri(CD, "body"), "cd:body", language),
            "source": [source_reference(dataset, annotation, "cd:body")],
        }
        if is_resource_type(dataset, annotation, "ChartPointAnnotation"):
            target = one(dataset, annotation, iri(CD, "targetObservation"))
            if target not in observation_ids:
                raise ValueError(f"Point annotation {compact(annotation)} targets an observation outside the chart dataset")
            annotations.append({**base, "kind": "point", "datumId": compact(target)})
        elif is_resource_type(dataset, annotation, "ChartRangeAnnotation"):
            start_observation = one(dataset, annotation, iri(CD, "startObservation"))
            end_observation = one(dataset, annotation, iri(CD, "endObservation"))
            if start_observation not in observation_ids or end_observation not in observation_ids:
                raise ValueError(f"Range annotation {compact(annotation)} targets an observation outside the chart dataset")
            annotations.append({
                **base,
                "kind": "x-range",
                "startDatumId": compact(start_observation),
                "endDatumId": compact(end_observation),
            })
        else:
            raise ValueError(f"Unsupported chart annotation type for {compact(annotation)}")

    label, label_relation_path = selected_label_reference(dataset, chart, language)
    x_unit = literal(dataset, chart, iri(CD, "xAxisUnit"))
    y_unit = literal(dataset, chart, iri(CD, "yAxisUnit"))
    payload: dict[str, Any] = {
        "chartType": "line",
        "label": label,
        "description": selected_literal(dataset, chart, iri(CD, "body"), "cd:body", language),
        "xAxis": {
            "label": selected_literal(dataset, chart, iri(CD, "xAxisLabel"), "cd:xAxisLabel", language),
            **({"unit": x_unit} if x_unit else {}),
        },
        "yAxis": {
            "label": selected_literal(dataset, chart, iri(CD, "yAxisLabel"), "cd:yAxisLabel", language),
            **({"unit": y_unit} if y_unit else {}),
        },
        "series": [{
            "id": series_id,
            "label": series_label,
            "data": data,
            "source": [source_reference(dataset, chart_dataset, series_label_path)],
        }],
        "annotations": annotations,
    }
    return payload, label_relation_path


def chart_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    chart_type = one(dataset, chart, iri(CD, "chartType"))
    if chart_type == iri(CD, "BarChart"):
        return bar_chart_payload(dataset, chart, language)
    if chart_type == iri(CD, "LineChart"):
        return line_chart_payload(dataset, chart, language)
    raise ValueError(f"Unsupported chart type for {compact(chart)}: {compact(chart_type)}")

def selected_path_scene_items(dataset: Dataset, selected_path: CoursePathReference) -> list[URIRef]:
    path = URIRef(selected_path.path_id)
    path_graph = dataset.graph(URIRef(selected_path.path_graph_id))
    if (path, RDF.type, iri(CD, "LearningPath")) not in path_graph:
        raise ValueError(
            f"Selected LearningPath {compact(path)} is not defined in expected graph {selected_path.path_graph_id}"
        )
    steps = sorted(
        set(path_graph.objects(path, iri(CD, "hasStep"))),
        key=lambda step: (integer(dataset, step, iri(CD, "position")), str(step)),
    )
    items: list[URIRef] = []
    for step in steps:
        scene_id = one(dataset, step, iri(CD, "usesScene"))
        items.extend(
            item
            for item in sorted(
                objects(dataset, scene_id, iri(CD, "hasSceneItem")),
                key=lambda candidate: (integer(dataset, candidate, iri(CD, "position")), str(candidate)),
            )
            if isinstance(item, URIRef)
        )
    return items


def effective_path_language(dataset: Dataset, selected_path: CoursePathReference) -> str:
    languages = sorted(
        {
            value
            for item in selected_path_scene_items(dataset, selected_path)
            if (value := literal(dataset, item, iri(CD, "language"))) is not None
        }
    )
    if not languages:
        raise ValueError(f"Selected LearningPath {compact(selected_path.path_id)} has no explicit cd:language")
    if len(languages) != 1:
        raise ValueError(
            f"Conflicting explicit cd:language values for selected LearningPath {compact(selected_path.path_id)}: {', '.join(languages)}"
        )
    return languages[0]


def compile_scene_document(dataset: Dataset, selected_path: CoursePathReference) -> dict[str, Any]:
    path = URIRef(selected_path.path_id)
    path_graph = dataset.graph(URIRef(selected_path.path_graph_id))
    if (path, RDF.type, iri(CD, "LearningPath")) not in path_graph:
        raise ValueError(
            f"Selected LearningPath {compact(path)} is not defined in expected graph {selected_path.path_graph_id}"
        )
    steps = sorted(
        set(path_graph.objects(path, iri(CD, "hasStep"))),
        key=lambda step: (integer(dataset, step, iri(CD, "position")), str(step)),
    )
    positions = [integer(dataset, step, iri(CD, "position")) for step in steps]
    if positions != list(range(1, len(steps) + 1)):
        raise ValueError("Path positions must be unique and contiguous")

    document_version = "1.0"
    scenes: list[dict[str, Any]] = []
    for step in steps:
        scene_id = one(dataset, step, iri(CD, "usesScene"))
        focus = one(dataset, scene_id, iri(CD, "focusConcept"))
        items = sorted(objects(dataset, scene_id, iri(CD, "hasSceneItem")), key=lambda item: (integer(dataset, item, iri(CD, "position")), str(item)))
        blocks: list[dict[str, Any]] = []
        for item in items:
            position = integer(dataset, item, iri(CD, "position"))
            selected = one(dataset, item, iri(CD, "selectsResource"))
            role = local_name(one(dataset, item, iri(CD, "communicativeRole")))
            relation_path = literal(dataset, item, iri(CD, "selectionPath"))
            language = literal(dataset, item, iri(CD, "language"))
            block_id = f"{compact(item)}--block"
            selected_is_math_expression = is_resource_type(dataset, selected, "MathExpression")
            selected_is_attribution = is_resource_type(dataset, selected, "Attribution")
            selected_is_flow_diagram = is_resource_type(dataset, selected, "FlowDiagram")
            selected_is_chart_definition = is_resource_type(dataset, selected, "ChartDefinition")
            if selected_is_attribution and role != "AttributionRole":
                raise ValueError(f"Attribution {compact(selected)} requires AttributionRole in {compact(item)}")
            if selected_is_flow_diagram and role != "DiagramRole":
                raise ValueError(f"FlowDiagram {compact(selected)} requires DiagramRole in {compact(item)}")
            if selected_is_chart_definition and role != "ChartRole":
                raise ValueError(f"ChartDefinition {compact(selected)} requires ChartRole in {compact(item)}")
            if role == "FormulaRole":
                if relation_path != "cd:latex":
                    raise ValueError(f"FormulaRole requires direct cd:latex selection in {compact(item)}")
                if not selected_is_math_expression:
                    raise ValueError(f"FormulaRole requires MathExpression in {compact(item)}")
                expression = literal(dataset, selected, iri(CD, "latex"))
                if expression is None:
                    raise ValueError(f"Missing cd:latex for {compact(selected)}")
                focus_label = resource_text(dataset, focus, language or "de")
                block = {
                    "id": block_id, "kind": "math",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "expression": expression,
                    "spokenText": f"Mathematische Formel für {focus_label}",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "explain"},
                }
            elif selected_is_math_expression:
                raise ValueError(
                    f"MathExpression {compact(selected)} requires FormulaRole with direct cd:latex selection"
                )
            elif role == "HeadingRole":
                heading_languages = {
                    "skos:prefLabel@de": "de",
                    "skos:prefLabel@en": "en",
                }
                heading_language = heading_languages.get(relation_path)
                if selected != focus or heading_language is None:
                    raise ValueError(f"Invalid heading selection in {compact(item)}")
                if language is not None and language != heading_language:
                    raise ValueError(f"Heading language does not match selector in {compact(item)}")
                text = selected_literal(dataset, selected, SKOS.prefLabel, relation_path, heading_language)
                block: dict[str, Any] = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "introduce"},
                }
            elif role == "KeyPointRole":
                if relation_path != "cd:hasKeyPoint":
                    raise ValueError(f"KeyPointRole requires direct cd:hasKeyPoint selection in {compact(item)}")
                points = keypoint_sequence(dataset, selected, language)
                block = {
                    "id": block_id,
                    "kind": "list",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "listStyle": "unordered",
                    "items": [
                        {
                            "id": f"{compact(point)}--list-item",
                            "text": text,
                            "source": [source_reference(dataset, point, "cd:body")],
                        }
                        for point, _point_position, text in points
                    ],
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary",
                    "intent": {"kind": "explain"},
                }
            elif role == "AttributionRole":
                if relation_path != "cd:body":
                    raise ValueError(f"AttributionRole requires direct cd:body selection in {compact(item)}")
                if not selected_is_attribution:
                    raise ValueError(f"AttributionRole requires Attribution in {compact(item)}")
                text = selected_literal(dataset, selected, iri(CD, "body"), relation_path, language)
                block = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "supporting", "intent": {"kind": "emphasize"},
                }
            elif role == "ChartRole":
                if relation_path != "cd:body":
                    raise ValueError(f"ChartRole requires direct cd:body selection in {compact(item)}")
                if not selected_is_chart_definition:
                    raise ValueError(f"ChartRole requires ChartDefinition in {compact(item)}")
                path_language = effective_path_language(dataset, selected_path)
                payload, label_relation_path = chart_payload(dataset, selected, path_language)
                block_sources = [source_reference(dataset, selected, relation_path)]
                if label_relation_path is not None and label_relation_path != relation_path:
                    block_sources.append(source_reference(dataset, selected, label_relation_path))
                block = {
                    "id": block_id,
                    "kind": "chart",
                    "source": block_sources,
                    **payload,
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary",
                    "intent": {"kind": "explain"},
                }
                document_version = "1.2"
            elif role == "DiagramRole":
                if relation_path != "cd:body":
                    raise ValueError(f"DiagramRole requires direct cd:body selection in {compact(item)}")
                if not selected_is_flow_diagram:
                    raise ValueError(f"DiagramRole requires FlowDiagram in {compact(item)}")
                path_language = effective_path_language(dataset, selected_path)
                payload, label_relation_path = flow_diagram_payload(dataset, selected, path_language)
                block_sources = [source_reference(dataset, selected, relation_path)]
                if label_relation_path is not None and label_relation_path != relation_path:
                    block_sources.append(source_reference(dataset, selected, label_relation_path))
                block = {
                    "id": block_id,
                    "kind": "diagram",
                    "source": block_sources,
                    **payload,
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary",
                    "intent": {"kind": "explain"},
                }
                document_version = "1.1"
            elif role in {"StatementRole", "ExampleRole", "ExerciseRole"}:
                if relation_path != "cd:body":
                    raise ValueError(f"{role} requires direct cd:body selection in {compact(item)}")
                if role == "StatementRole":
                    if not (
                        is_resource_type(dataset, selected, "Definition")
                        or is_resource_type(dataset, selected, "Interpretation")
                    ):
                        raise ValueError(f"StatementRole requires Definition or Interpretation in {compact(item)}")
                elif role == "ExampleRole" and not is_resource_type(dataset, selected, "WorkedExample"):
                    raise ValueError(f"ExampleRole requires WorkedExample in {compact(item)}")
                elif role == "ExerciseRole" and not is_resource_type(dataset, selected, "Exercise"):
                    raise ValueError(f"ExerciseRole requires Exercise in {compact(item)}")
                text = selected_literal(dataset, selected, iri(CD, "body"), relation_path, language)
                if role == "ExerciseRole":
                    block = {
                        "id": block_id, "kind": "prompt",
                        "source": [source_reference(dataset, selected, relation_path)],
                        "prompt": text,
                        "responseMode": "free-text",
                        "fallback": text,
                        "disclosure": {"order": position - 1, "mode": "initial"},
                        "emphasis": "primary", "intent": {"kind": "practice"},
                    }
                else:
                    block = {
                        "id": block_id, "kind": "prose",
                        "source": [source_reference(dataset, selected, relation_path)],
                        "text": text, "format": "plain",
                        "disclosure": {"order": position - 1, "mode": "initial"},
                        "emphasis": "primary", "intent": {"kind": "explain"},
                    }
            elif is_resource_type(dataset, selected, "CodeExample"):
                if role != "CodeRole":
                    raise ValueError(f"Code example {compact(selected)} requires CodeRole")
                code = literal(dataset, selected, iri(CD, "code"))
                programming_language = literal(dataset, selected, iri(CD, "programmingLanguage"))
                if code is None or programming_language is None:
                    raise ValueError(f"Incomplete executable code resource {compact(selected)}")
                block = {
                    "id": block_id, "kind": "code",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "language": programming_language,
                    "code": code,
                    "editable": boolean_literal(dataset, selected, iri(CD, "editable")),
                    "executable": boolean_literal(dataset, selected, iri(CD, "executable")),
                    "fallback": code,
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "practice"},
                }
            elif is_resource_type(dataset, selected, "AudiencePoll"):
                if role != "PollRole":
                    raise ValueError(f"Audience poll {compact(selected)} requires PollRole")
                prompt = resource_text(dataset, selected, language or "de")
                option_resources = [value for value in objects(dataset, selected, iri(CD, "hasPollOption")) if isinstance(value, URIRef)]
                if len(option_resources) < 2:
                    raise ValueError(f"Audience poll {compact(selected)} requires at least two options")
                options = [resource_text(dataset, option, language or "de") for option in option_resources]
                sources = [source_reference(dataset, selected, relation_path)] + [
                    source_reference(dataset, option, "cd:hasPollOption") for option in option_resources
                ]
                block = {
                    "id": block_id, "kind": "prompt",
                    "source": sources,
                    "prompt": prompt,
                    "responseMode": "single-choice",
                    "options": options,
                    "fallback": f'{prompt} {" / ".join(options)}',
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "practice"},
                }
            elif role == "QuotationRole":
                text = resource_text(dataset, selected, language or "de")
                block = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "explain"},
                }
            elif role == "CitationRole":
                text = resource_text(dataset, selected, None)
                block = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "supporting", "intent": {"kind": "emphasize"},
                }
            else:
                raise ValueError(f"Unsupported communicative role {role}")
            blocks.append(block)
        scene_compact = compact(scene_id)
        first_block = blocks[0]
        accessibility_label = (
            first_block.get("text")
            or first_block.get("label")
            or first_block.get("spokenText")
            or first_block.get("prompt")
            or first_block["id"]
        )
        scenes.append({
            "id": f"{scene_compact}--scene",
            "source": [source_reference(dataset, scene_id), source_reference(dataset, focus)],
            "blocks": blocks,
            "readingOrder": [block["id"] for block in blocks],
            "accessibility": {"label": accessibility_label},
        })
    return {"version": document_version, "id": f"{compact(path)}--scene-document", "sourcePathId": compact(path), "scenes": scenes}


def dataset_snapshot(dataset: Dataset, fingerprint: str, language: str) -> dict[str, Any]:
    typed_subjects = sorted({subject for subject, _p, _o, _g in dataset.quads((None, RDF.type, None, None)) if isinstance(subject, URIRef) and str(subject).startswith(EX)}, key=str)
    entity_ids = set(typed_subjects)
    entities: list[dict[str, Any]] = []
    for subject in typed_subjects:
        labels = (
            literal(dataset, subject, SKOS.prefLabel, language)
            or deterministic_authored_literal(dataset, subject, DCTERMS.title)
            or deterministic_authored_literal(dataset, subject, iri(SCHEMA, "name"))
            or local_name(subject)
        )
        description = (
            literal(dataset, subject, iri(CD, "body"), language)
            or literal(dataset, subject, DCTERMS.description, language)
            or deterministic_authored_literal(dataset, subject, iri(CD, "body"))
            or deterministic_authored_literal(dataset, subject, DCTERMS.description)
        )
        entity: dict[str, Any] = {
            "id": compact(subject), "label": labels,
            "semanticTypes": sorted(compact(value) for value in objects(dataset, subject, RDF.type) if isinstance(value, URIRef)),
            "source": [source_reference(dataset, subject)],
        }
        if description:
            entity["description"] = description
        external = [str(value) for value in objects(dataset, subject, DCTERMS.source) if isinstance(value, URIRef)]
        if external:
            entity["externalReferences"] = [{"uri": value} for value in sorted(external)]
        entities.append(entity)

    statements: list[dict[str, Any]] = []
    for subject, predicate, target, graph in dataset.quads((None, None, None, None)):
        if subject not in entity_ids or target not in entity_ids or predicate == RDF.type:
            continue
        statements.append({
            "sourceEntityId": compact(subject), "predicateId": compact(predicate),
            "targetEntityId": compact(target), "predicateLabel": local_name(predicate),
            "source": [{"resourceId": compact(subject), "provenanceIds": [str(graph)]}],
        })
    statements.sort(key=lambda item: (item["sourceEntityId"], item["predicateId"], item["targetEntityId"]))
    return {
        "version": "1.0", "identity": f"sha256:{fingerprint}",
        "entities": entities, "statements": statements,
        "supportedPredicates": sorted({item["predicateId"] for item in statements}),
        "source": [{"resourceId": "canonical-trig-dataset", "provenanceIds": sorted(str(path.relative_to(ROOT)) for path in (ROOT / "ontology" / "dataset").glob("*.trig"))}],
    }


def default_selection_request() -> CourseUnitPathSelectionRequest:
    return CourseUnitPathSelectionRequest(
        offering_id=DEFAULT_OFFERING_ID,
        placement_id=DEFAULT_PLACEMENT_ID,
        unit_id=DEFAULT_UNIT_ID,
    )


def build_artifact(
    selection_request: CourseUnitPathSelectionRequest | None = None,
) -> dict[str, Any]:
    request = selection_request or default_selection_request()
    dataset = assemble_dataset()
    selection = select_course_unit_path(dataset, request)
    language = effective_path_language(dataset, selection.path)
    fingerprint = dataset_fingerprint(dataset)
    fingerprint_identity = f"sha256:{fingerprint}"
    return {
        "artifactVersion": "1.0", "datasetFingerprint": fingerprint_identity,
        "datasetSnapshot": dataset_snapshot(dataset, fingerprint, language),
        "teachingOfferingDocuments": [
            project_teaching_offering_runtime_document(
                dataset,
                request.offering_id,
                fingerprint_identity,
            )
        ],
        "sceneDocuments": [compile_scene_document(dataset, selection.path)],
    }


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def fallback_attributes(sources: list[dict[str, Any]]) -> str:
    attributes = []
    resource_ids = sorted({source["resourceId"] for source in sources})
    provenance_ids = sorted({value for source in sources for value in source.get("provenanceIds", [])})
    relation_paths = sorted({source["relationPath"] for source in sources if source.get("relationPath")})
    if resource_ids:
        attributes.append(f'data-resource-id="{html.escape(" ".join(resource_ids), quote=True)}"')
    if provenance_ids:
        attributes.append(f'data-provenance-ids="{html.escape(" ".join(provenance_ids), quote=True)}"')
    if relation_paths:
        attributes.append(f'data-relation-path="{html.escape(" ".join(relation_paths), quote=True)}"')
    return " " + " ".join(attributes) if attributes else ""


def static_fallback(artifact: dict[str, Any]) -> str:
    document = artifact["sceneDocuments"][0]
    articles = []
    for scene in document["scenes"]:
        blocks = []
        for block in scene["blocks"]:
            if block["kind"] == "math":
                blocks.append(
                    f'<div class="math-fallback" role="math" aria-label="{html.escape(block["spokenText"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<code>{html.escape(block["expression"])}</code>'
                    f'</div>'
                )
                continue
            if block["kind"] == "code":
                blocks.append(
                    f'<div class="code-fallback" data-code-block-id="{html.escape(block["id"], quote=True)}" '
                    f'data-language="{html.escape(block["language"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<pre><code>{html.escape(block["fallback"])}</code></pre>'
                    f'</div>'
                )
                continue
            if block["kind"] == "list":
                tag = "ol" if block["listStyle"] == "ordered" else "ul"
                items = "".join(
                    f'<li data-list-item-id="{html.escape(item["id"], quote=True)}"{fallback_attributes(item["source"])}>{html.escape(item["text"])}</li>'
                    for item in block["items"]
                )
                blocks.append(
                    f'<{tag} class="keypoint-list"{fallback_attributes(block["source"])}>{items}</{tag}>'
                )
                continue
            if block["kind"] == "chart":
                if block["chartType"] == "bar":
                    unit = block.get("yAxis", {}).get("unit")
                    value_items = "".join(
                        f'<li data-chart-datum-id="{html.escape(datum["id"], quote=True)}"{fallback_attributes(datum["source"])}>'
                        f'<span class="chart-category">{html.escape(datum["category"])}</span>: '
                        f'<span class="chart-value">{html.escape(str(datum["value"]))}{(" " + html.escape(unit)) if unit else ""}</span>'
                        f'</li>'
                        for datum in block["data"]
                    )
                    body = f'<ol class="chart-data">{value_items}</ol>'
                elif block["chartType"] == "line":
                    point_items = "".join(
                        f'<li data-chart-datum-id="{html.escape(datum["id"], quote=True)}"{fallback_attributes(datum["source"])}>'
                        f'x={html.escape(str(datum["x"]))}, y={html.escape(str(datum["y"]))}</li>'
                        for series in block["series"]
                        for datum in series["data"]
                    )
                    annotation_items = "".join(
                        f'<li data-chart-annotation-id="{html.escape(annotation["id"], quote=True)}">'
                        f'{html.escape(annotation["label"])}</li>'
                        for annotation in block.get("annotations", [])
                    )
                    body = f'<ol class="chart-data">{point_items}</ol><ul class="chart-annotations">{annotation_items}</ul>'
                else:
                    raise ValueError(f'Unsupported chart type in static fallback: {block["chartType"]}')
                blocks.append(
                    f'<figure class="chart-fallback" data-chart-type="{html.escape(block["chartType"], quote=True)}"'
                    f'{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["label"])}</strong> '
                    f'<span>{html.escape(block["description"])}</span></figcaption>'
                    f'<p class="chart-axis-summary">{html.escape(block["xAxis"]["label"])} / '
                    f'{html.escape(block["yAxis"]["label"])}</p>{body}</figure>'
                )
                continue
            if block["kind"] == "diagram":
                labels = {node["id"]: node["label"] for node in block["nodes"]}
                nodes = "".join(
                    f'<li data-diagram-node-id="{html.escape(node["id"], quote=True)}"{fallback_attributes(node["source"])}>{html.escape(node["label"])}</li>'
                    for node in block["nodes"]
                )
                edges = "".join(
                    f'<li data-diagram-edge-id="{html.escape(edge["id"], quote=True)}"{fallback_attributes(edge["source"])}>'
                    f'{html.escape(labels.get(edge["sourceNodeId"], edge["sourceNodeId"]))} — '
                    f'{html.escape(edge["label"])} → '
                    f'{html.escape(labels.get(edge["targetNodeId"], edge["targetNodeId"]))}'
                    f'</li>'
                    for edge in block["edges"]
                )
                focus_attribute = (
                    f' data-focus-node-id="{html.escape(block["focusNodeId"], quote=True)}"'
                    if block.get("focusNodeId")
                    else ""
                )
                blocks.append(
                    f'<figure class="diagram-fallback" data-diagram-type="{html.escape(block["diagramType"], quote=True)}"'
                    f'{focus_attribute}{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["label"])}</strong> <span>{html.escape(block["description"])}</span></figcaption>'
                    f'<ol class="diagram-nodes">{nodes}</ol>'
                    f'<ol class="diagram-edges">{edges}</ol>'
                    f'</figure>'
                )
                continue
            if block["kind"] == "prompt":
                response_mode = block.get("responseMode")
                if response_mode is None:
                    raise ValueError("Prompt block requires responseMode")
                if response_mode == "single-choice":
                    prompt_options = block.get("options")
                    if not prompt_options:
                        raise ValueError("single-choice prompt requires at least one option")
                    poll_key = block["source"][0]["resourceId"]
                    option_ids = " ".join(source["resourceId"] for source in block["source"][1:])
                    options = "".join(f'<li>{html.escape(option)}</li>' for option in prompt_options)
                    blocks.append(
                        f'<div class="poll-fallback" data-poll-key="{html.escape(poll_key, quote=True)}" '
                        f'data-poll-option-ids="{html.escape(option_ids, quote=True)}"{fallback_attributes(block["source"])}>'
                        f'<p>{html.escape(block["prompt"])}</p><ul>{options}</ul>'
                        f'</div>'
                    )
                elif response_mode == "free-text":
                    blocks.append(
                        f'<div class="prompt-fallback"{fallback_attributes(block["source"])}>'
                        f'<p>{html.escape(block["prompt"])}</p>'
                        f'</div>'
                    )
                else:
                    raise ValueError(f"Unsupported prompt response mode: {response_mode}")
                continue
            tag = "h2" if block["intent"]["kind"] == "introduce" else "blockquote" if block["intent"]["kind"] == "explain" else "cite"
            class_name = ' class="lead"' if tag == "blockquote" else ' class="citation"' if tag == "cite" else ""
            blocks.append(
                f'<{tag}{class_name}{fallback_attributes(block["source"])}>'
                f'{html.escape(block["text"])}'
                f'</{tag}>'
            )
        articles.append(
            f'<article data-pitch-step="{html.escape(scene["id"], quote=True)}" '
            f'data-source-path-id="{html.escape(document["sourcePathId"], quote=True)}"{fallback_attributes(scene["source"])}>'
            + "".join(blocks)
            + "</article>"
        )
    return "\n".join(articles)


def rendered_index(artifact: dict[str, Any]) -> str:
    source = PITCH_INDEX.read_text(encoding="utf-8")
    generated = static_fallback(artifact)
    pattern = r"(?s)(<!-- canonical-runtime-fallback:start -->).*?(<!-- canonical-runtime-fallback:end -->)"
    replacement = lambda match: f"{match.group(1)}\n{generated}\n        {match.group(2)}"
    updated, count = re.subn(pattern, replacement, source, count=1)
    if count != 1:
        raise ValueError("Missing canonical runtime fallback markers in apps/pitch/index.html")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="fail when an existing artifact differs")
    parser.add_argument("--offering-id", default=DEFAULT_OFFERING_ID)
    parser.add_argument("--placement-id", default=DEFAULT_PLACEMENT_ID)
    parser.add_argument("--unit-id", default=DEFAULT_UNIT_ID)
    parser.add_argument("--path-id")
    parser.add_argument("--path-graph-id")
    args = parser.parse_args()
    artifact = build_artifact(
        CourseUnitPathSelectionRequest(
            offering_id=args.offering_id,
            placement_id=args.placement_id,
            unit_id=args.unit_id,
            requested_path_id=args.path_id,
            requested_path_graph_id=args.path_graph_id,
        )
    )
    rendered = canonical_json(artifact)
    rendered_html = rendered_index(artifact)
    output = args.output if args.output.is_absolute() else ROOT / args.output
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != rendered:
            raise SystemExit(f"Stale or missing generated artifact: {output.relative_to(ROOT)}")
        if PITCH_INDEX.read_text(encoding="utf-8") != rendered_html:
            raise SystemExit("Stale canonical runtime static fallback: apps/pitch/index.html")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8", newline="\n")
    PITCH_INDEX.write_text(rendered_html, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())