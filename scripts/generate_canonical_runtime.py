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

from rdflib import DCTERMS, RDF, SKOS, XSD, Dataset, Literal, URIRef

from course_path_selection import (
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)
from rdf_dataset import assemble_dataset, dataset_fingerprint
from teaching_offering_runtime import project_teaching_offering_runtime_document
from histogram_statistics import bins as histogram_bins, cells as histogram_cells

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


def is_diagram_resource(dataset: Dataset, resource: URIRef) -> bool:
    return any(
        is_resource_type(dataset, resource, type_name)
        for type_name in ("FlowDiagram", "NetworkDiagram", "SequenceDiagram")
    )


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


def definition_list_sequence(
    dataset: Dataset,
    owner: URIRef,
    language: str | None,
) -> list[tuple[URIRef, int, str, str, str | None, str | None, str | None]]:
    predicate = iri(CD, "hasDefinitionListEntry")
    linked = [value for value in objects(dataset, owner, predicate) if isinstance(value, URIRef)]
    if not linked:
        raise ValueError(f"DefinitionListRole requires linked entries for {compact(owner)}")
    records: list[tuple[URIRef, int, str, str, str | None, str | None, str | None]] = []
    seen_positions: set[int] = set()
    for entry in linked:
        if not is_resource_type(dataset, entry, "DefinitionListEntry"):
            raise ValueError(f"Linked resource {compact(entry)} is not a DefinitionListEntry")
        owners = sorted(
            {
                subject
                for subject, _predicate, _object, _graph in dataset.quads((None, predicate, entry, None))
                if isinstance(subject, URIRef)
            },
            key=str,
        )
        if owners != [owner]:
            raise ValueError(f"DefinitionListEntry {compact(entry)} must have exactly one owning DefinitionList")
        position = integer(dataset, entry, iri(CD, "position"))
        if position in seen_positions:
            raise ValueError(f"DefinitionList entry positions must be unique for {compact(owner)}")
        seen_positions.add(position)
        if language is None:
            raise ValueError(f"DefinitionListRole requires explicit cd:language for {compact(owner)}")
        term = selected_literal(dataset, entry, SKOS.prefLabel, f"skos:prefLabel@{language}", language)
        description = literal(dataset, entry, iri(CD, "body"), language)
        visual_motif = literal(dataset, entry, iri(CD, "visualMotif"))
        visual_motif_role = literal(dataset, entry, iri(CD, "visualMotifRole"))
        records.append((entry, position, term, f"skos:prefLabel@{language}", description, visual_motif, visual_motif_role))
    records.sort(key=lambda record: (record[1], str(record[0])))
    positions = [position for _entry, position, _term, _term_path, _description, _visual_motif, _visual_motif_role in records]
    if positions != list(range(1, len(records) + 1)):
        raise ValueError(f"DefinitionList entry positions must be contiguous for {compact(owner)}")
    return records


def table_payload(dataset: Dataset, table: URIRef, language: str | None) -> tuple[dict[str, Any], str | None]:
    if language is None:
        raise ValueError(f"TableRole requires explicit cd:language for {compact(table)}")

    column_predicate = iri(CD, "hasTableColumn")
    row_predicate = iri(CD, "hasTableRow")
    cell_predicate = iri(CD, "hasTableCell")

    columns = [
        (column, integer(dataset, column, iri(CD, "position")))
        for column in objects(dataset, table, column_predicate)
        if isinstance(column, URIRef)
    ]
    rows = [
        (row, integer(dataset, row, iri(CD, "position")))
        for row in objects(dataset, table, row_predicate)
        if isinstance(row, URIRef)
    ]
    columns.sort(key=lambda record: (record[1], str(record[0])))
    rows.sort(key=lambda record: (record[1], str(record[0])))

    if not columns or not rows:
        raise ValueError(f"TableDefinition {compact(table)} requires columns and rows")
    if [position for _column, position in columns] != list(range(1, len(columns) + 1)):
        raise ValueError(f"TableColumn positions must be unique and contiguous for {compact(table)}")
    if [position for _row, position in rows] != list(range(1, len(rows) + 1)):
        raise ValueError(f"TableRow positions must be unique and contiguous for {compact(table)}")

    column_values: list[dict[str, Any]] = []
    for column, _position in columns:
        if not is_resource_type(dataset, column, "TableColumn"):
            raise ValueError(f"Linked resource {compact(column)} is not a TableColumn")
        owners = sorted(
            {
                subject
                for subject, _predicate, _object, _graph in dataset.quads((None, column_predicate, column, None))
                if isinstance(subject, URIRef)
            },
            key=str,
        )
        if owners != [table]:
            raise ValueError(f"TableColumn {compact(column)} must have exactly one owning TableDefinition")
        label = selected_literal(dataset, column, SKOS.prefLabel, f"skos:prefLabel@{language}", language)
        column_values.append({
            "id": compact(column),
            "label": label,
            "source": [source_reference(dataset, column, f"skos:prefLabel@{language}")],
        })

    row_values: list[dict[str, Any]] = []
    for row, _position in rows:
        if not is_resource_type(dataset, row, "TableRow"):
            raise ValueError(f"Linked resource {compact(row)} is not a TableRow")
        row_owners = sorted(
            {
                subject
                for subject, _predicate, _object, _graph in dataset.quads((None, row_predicate, row, None))
                if isinstance(subject, URIRef)
            },
            key=str,
        )
        if row_owners != [table]:
            raise ValueError(f"TableRow {compact(row)} must have exactly one owning TableDefinition")

        cells = [
            (cell, integer(dataset, cell, iri(CD, "position")))
            for cell in objects(dataset, row, cell_predicate)
            if isinstance(cell, URIRef)
        ]
        cells.sort(key=lambda record: (record[1], str(record[0])))
        if [position for _cell, position in cells] != list(range(1, len(cells) + 1)):
            raise ValueError(f"TableCell positions must be unique and contiguous for {compact(row)}")
        if len(cells) != len(columns):
            raise ValueError(f"TableRow {compact(row)} must contain exactly one cell per column")

        cell_values: list[dict[str, Any]] = []
        for cell, _cell_position in cells:
            if not is_resource_type(dataset, cell, "TableCell"):
                raise ValueError(f"Linked resource {compact(cell)} is not a TableCell")
            cell_owners = sorted(
                {
                    subject
                    for subject, _predicate, _object, _graph in dataset.quads((None, cell_predicate, cell, None))
                    if isinstance(subject, URIRef)
                },
                key=str,
            )
            if cell_owners != [row]:
                raise ValueError(f"TableCell {compact(cell)} must have exactly one owning TableRow")
            text = selected_literal(dataset, cell, iri(CD, "body"), "cd:body", language)
            cell_values.append({
                "id": compact(cell),
                "text": text,
                "source": [source_reference(dataset, cell, "cd:body")],
            })

        row_values.append({
            "id": compact(row),
            "cells": cell_values,
            "source": [source_reference(dataset, row, "cd:hasTableCell")],
        })

    caption, caption_relation_path = selected_label_reference(dataset, table, language)
    description = literal(dataset, table, iri(CD, "body"), language)
    return {
        "caption": caption,
        **({"description": description} if description is not None else {}),
        "columns": column_values,
        "rows": row_values,
    }, caption_relation_path


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
    if is_resource_type(dataset, diagram, "SequenceDiagram"):
        return sequence_diagram_payload(dataset, diagram, language)
    diagram_type = "network" if is_resource_type(dataset, diagram, "NetworkDiagram") else "flow"
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
    if diagram_type == "flow" and not edge_records:
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
        node_description = literal(dataset, node, iri(CD, "body"), language)
        node_notation = literal(dataset, node, SKOS.notation)
        node_sources = [source_reference(dataset, node, relation_path)]
        if node_description is not None:
            node_sources.append(source_reference(dataset, node, "cd:body"))
        if node_notation is not None:
            node_sources.append(source_reference(dataset, node, "skos:notation"))
        node_value: dict[str, Any] = {
            "id": compact(node),
            "label": label,
            **({"description": node_description} if node_description is not None else {}),
            **({"notation": node_notation} if node_notation is not None else {}),
            "source": node_sources,
        }
        visual_role = one(dataset, node, iri(CD, "visualRole"), required=False)
        if visual_role is not None:
            node_value["visualRole"] = str(visual_role)
            node_sources.append(source_reference(dataset, node, "cd:visualRole"))
        visual_motif = literal(dataset, node, iri(CD, "visualMotif"))
        if visual_motif is not None:
            node_value["visualMotif"] = visual_motif
            node_sources.append(source_reference(dataset, node, "cd:visualMotif"))
        visual_motif_role = literal(dataset, node, iri(CD, "visualMotifRole"))
        if visual_motif_role is not None:
            node_value["visualMotifRole"] = visual_motif_role
            node_sources.append(source_reference(dataset, node, "cd:visualMotifRole"))
        part_resources = [
            (part, integer(dataset, part, iri(CD, "position")))
            for part in objects(dataset, node, iri(CD, "hasDiagramNodePart"))
            if isinstance(part, URIRef)
        ]
        if part_resources:
            part_resources.sort(key=lambda record: (record[1], str(record[0])))
            positions = [position for _part, position in part_resources]
            if len(part_resources) < 2 or positions != list(range(1, len(part_resources) + 1)):
                raise ValueError(f"DiagramNode parts must have at least two entries with contiguous positions in {compact(node)}")
            node_parts = []
            for part, _position in part_resources:
                part_label, part_path = selected_label_reference(dataset, part, language)
                part_description = literal(dataset, part, iri(CD, "body"), language)
                node_parts.append({
                    "id": compact(part), "label": part_label,
                    **({"description": part_description} if part_description is not None else {}),
                    "source": [source_reference(dataset, part, part_path)],
                })
            node_value["parts"] = node_parts
        group_ids = [compact(group) for group in objects(dataset, node, iri(CD, "memberOfDiagramGroup")) if isinstance(group, URIRef)]
        if group_ids:
            node_value["groupIds"] = sorted(group_ids)
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
        edge_value: dict[str, Any] = {
            "id": compact(edge),
            "sourceNodeId": compact(source_node),
            "targetNodeId": compact(target_node),
            "label": label,
            "source": [source_reference(dataset, edge, relation_path)],
        }
        visual_role = one(dataset, edge, iri(CD, "visualRole"), required=False)
        if visual_role is not None:
            edge_value["visualRole"] = str(visual_role)
        edges.append(edge_value)

    label, label_relation_path = selected_label_reference(dataset, diagram, language)
    group_resources = [group for group in objects(dataset, diagram, iri(CD, "hasDiagramGroup")) if isinstance(group, URIRef)]
    positioned_groups = [
        (group, integer(dataset, group, iri(CD, "position")))
        for group in group_resources
        if objects(dataset, group, iri(CD, "position"))
    ]
    if positioned_groups:
        if len(positioned_groups) != len(group_resources):
            raise ValueError(f"DiagramGroup positions must be present for every group of {compact(diagram)}")
        positioned_groups.sort(key=lambda record: (record[1], str(record[0])))
        group_positions = [position for _group, position in positioned_groups]
        if group_positions != list(range(1, len(positioned_groups) + 1)):
            raise ValueError(f"DiagramGroup positions must be unique and contiguous for {compact(diagram)}")
        ordered_groups = [group for group, _position in positioned_groups]
    else:
        ordered_groups = sorted(group_resources, key=str)

    groups = []
    for group in ordered_groups:
        group_label, group_relation_path = selected_label_reference(dataset, group, language)
        groups.append({"id": compact(group), "label": group_label, "source": [source_reference(dataset, group, group_relation_path)]})

    payload: dict[str, Any] = {
        "diagramType": diagram_type,
        "label": label,
        "description": selected_literal(dataset, diagram, iri(CD, "body"), "cd:body", language),
        "nodes": nodes,
        "edges": edges,
        **({"groups": groups} if groups else {}),
    }
    state_resources = [state for state in objects(dataset, diagram, iri(CD, "hasDiagramState")) if isinstance(state, URIRef)]
    positioned_states = [(state, integer(dataset, state, iri(CD, "position"))) for state in state_resources if objects(dataset, state, iri(CD, "position"))]
    if positioned_states:
        if len(positioned_states) != len(state_resources):
            raise ValueError(f"DiagramState positions must be present for every state of {compact(diagram)}")
        state_records = sorted(positioned_states, key=lambda record: (record[1], str(record[0])))
        state_positions = [position for _state, position in state_records]
        if state_positions != list(range(1, len(state_records) + 1)):
            raise ValueError(f"DiagramState positions must be unique and contiguous for {compact(diagram)}")
    else:
        # Existing state resources without authored progression retain their stable lexical order.
        state_records = [(state, 0) for state in sorted(state_resources, key=str)]
    states: list[dict[str, Any]] = []
    for state, _position in state_records:
        if not isinstance(state, URIRef):
            continue
        state_label, state_relation_path = selected_label_reference(dataset, state, language)
        annotations: list[dict[str, Any]] = []
        for annotation in sorted(objects(dataset, state, iri(CD, "hasSharedEdgeAnnotation")), key=str):
            if not isinstance(annotation, URIRef):
                continue
            annotation_edges = [edge for edge in objects(dataset, annotation, iri(CD, "annotatesDiagramEdge")) if isinstance(edge, URIRef)]
            if len(annotation_edges) < 2 or len(set(annotation_edges)) != len(annotation_edges):
                raise ValueError(f"SharedEdgeAnnotation {compact(annotation)} requires at least two unique DiagramEdges")
            if any(edge not in {edge for edge, _position in edge_records} for edge in annotation_edges):
                raise ValueError(f"SharedEdgeAnnotation {compact(annotation)} references an edge outside {compact(diagram)}")
            annotations.append({
                "id": compact(annotation),
                "label": selected_literal(dataset, annotation, iri(CD, "body"), "cd:body", language),
                "edgeIds": [compact(edge) for edge in sorted(annotation_edges, key=lambda edge: next(position for candidate, position in edge_records if candidate == edge))],
                "source": [source_reference(dataset, annotation, "cd:body")],
            })
        def state_members(predicate: str, allowed: set[URIRef], label: str) -> list[URIRef]:
            members = [member for member in objects(dataset, state, iri(CD, predicate)) if isinstance(member, URIRef)]
            if any(member not in allowed for member in members):
                raise ValueError(f"DiagramState {compact(state)} references a {label} outside {compact(diagram)}")
            return sorted(set(members), key=str)

        active_nodes = state_members("activeDiagramNode", node_ids, "node")
        active_edges = state_members("activeDiagramEdge", {edge for edge, _position in edge_records}, "edge")
        group_resources = {group for group in objects(dataset, diagram, iri(CD, "hasDiagramGroup")) if isinstance(group, URIRef)}
        active_groups = state_members("activeDiagramGroup", group_resources, "group")
        context_groups = state_members("contextDiagramGroup", group_resources, "context group")
        focus_nodes = state_members("focusDiagramNode", node_ids, "focus node")
        focus_groups = state_members("focusDiagramGroup", group_resources, "focus group")
        if len(focus_nodes) > 1 or len(focus_groups) > 1 or (focus_nodes and focus_groups):
            raise ValueError(f"DiagramState {compact(state)} may focus one node or one group, not both")
        state_value: dict[str, Any] = {
            "id": compact(state),
            "label": state_label,
            "source": [source_reference(dataset, state, state_relation_path)],
            "sharedEdgeAnnotations": annotations,
        }
        if active_nodes:
            state_value["activeNodeIds"] = [compact(node) for node in active_nodes]
        if active_edges:
            state_value["activeEdgeIds"] = [compact(edge) for edge in active_edges]
        if active_groups:
            state_value["activeGroupIds"] = [compact(group) for group in active_groups]
        if context_groups:
            state_value["contextGroupIds"] = [compact(group) for group in context_groups]
        if focus_nodes:
            state_value["focusNodeId"] = compact(focus_nodes[0])
        if focus_groups:
            state_value["focusGroupId"] = compact(focus_groups[0])
        states.append(state_value)
    if states:
        payload["states"] = states
    if focus_node is not None:
        payload["focusNodeId"] = compact(focus_node)
    return payload, label_relation_path


def sequence_diagram_payload(dataset: Dataset, diagram: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    label, label_relation_path = selected_label_reference(dataset, diagram, language)
    roles = sorted(
        [(role, integer(dataset, role, iri(CD, "position"))) for role in objects(dataset, diagram, iri(CD, "hasParticipantRole")) if isinstance(role, URIRef)],
        key=lambda record: (record[1], str(record[0])),
    )
    messages = sorted(
        [(message, integer(dataset, message, iri(CD, "position"))) for message in objects(dataset, diagram, iri(CD, "hasInteractionMessage")) if isinstance(message, URIRef)],
        key=lambda record: (record[1], str(record[0])),
    )
    if len(roles) < 2 or len(messages) < 1:
        raise ValueError(f"SequenceDiagram {compact(diagram)} requires participant roles and messages")
    if [position for _value, position in roles] != list(range(1, len(roles) + 1)) or [position for _value, position in messages] != list(range(1, len(messages) + 1)):
        raise ValueError(f"SequenceDiagram positions must be unique and contiguous for {compact(diagram)}")
    role_ids = {role for role, _position in roles}
    payload: dict[str, Any] = {
        "diagramType": "sequence", "label": label,
        "description": selected_literal(dataset, diagram, iri(CD, "body"), "cd:body", language),
        "nodes": [], "edges": [],
        "participantRoles": [{"id": compact(role), "label": selected_label_reference(dataset, role, language)[0], "source": [source_reference(dataset, role, selected_label_reference(dataset, role, language)[1])]} for role, _position in roles],
        "messages": [],
    }
    for message, _position in messages:
        source_role = one(dataset, message, iri(CD, "sourceParticipantRole")); target_role = one(dataset, message, iri(CD, "targetParticipantRole"))
        if source_role not in role_ids or target_role not in role_ids: raise ValueError(f"InteractionMessage {compact(message)} references a role outside {compact(diagram)}")
        message_label, relation_path = selected_label_reference(dataset, message, language)
        payload["messages"].append({"id": compact(message), "sourceRoleId": compact(source_role), "targetRoleId": compact(target_role), "label": message_label, "source": [source_reference(dataset, message, relation_path)]})
    states = []
    for state, _position in sorted([(state, integer(dataset, state, iri(CD, "position"))) for state in objects(dataset, diagram, iri(CD, "hasSequenceState")) if isinstance(state, URIRef)], key=lambda record: (record[1], str(record[0]))):
        state_label, relation_path = selected_label_reference(dataset, state, language)
        active = [message for message in objects(dataset, state, iri(CD, "activeInteractionMessage")) if isinstance(message, URIRef)]
        if any(message not in {message for message, _position in messages} for message in active): raise ValueError(f"DiagramState {compact(state)} references a message outside {compact(diagram)}")
        bindings = []
        for binding in sorted(objects(dataset, state, iri(CD, "hasParticipantBinding")), key=str):
            role = one(dataset, binding, iri(CD, "bindsParticipantRole")); participant = one(dataset, binding, iri(CD, "bindsParticipant"))
            if role not in role_ids: raise ValueError(f"ParticipantBinding {compact(binding)} references a role outside {compact(diagram)}")
            binding_label, binding_path = selected_label_reference(dataset, binding, language)
            bindings.append({"roleId": compact(role), "participantId": compact(participant), "label": binding_label, "source": [source_reference(dataset, binding, binding_path)]})
        states.append({"id": compact(state), "label": state_label, "source": [source_reference(dataset, state, relation_path)], "sharedEdgeAnnotations": [], **({"activeMessageIds": [compact(message) for message in active]} if active else {}), **({"participantBindings": bindings} if bindings else {})})
    if states: payload["states"] = states
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
    observation_ids = {observation for observation, _position in observations}
    for observation, _position in observations:
        category, relation_path = selected_label_reference(dataset, observation, language)
        group_label = literal(dataset, observation, iri(CD, "groupLabel"), language)
        data.append({
            "id": compact(observation),
            "category": category,
            **({"group": group_label} if group_label is not None else {}),
            "value": decimal_number(dataset, observation, iri(CD, "numericValue")),
            "source": [
                source_reference(dataset, observation, relation_path),
                *([source_reference(dataset, observation, "cd:groupLabel")] if group_label is not None else []),
                source_reference(dataset, observation, "cd:numericValue"),
            ],
        })

    annotation_records = [
        (annotation, integer(dataset, annotation, iri(CD, "position")))
        for annotation in objects(dataset, chart, iri(CD, "hasChartAnnotation"))
        if isinstance(annotation, URIRef)
    ]
    annotation_records.sort(key=lambda record: (record[1], str(record[0])))
    annotations: list[dict[str, Any]] = []
    for annotation, _position in annotation_records:
        if not is_resource_type(dataset, annotation, "ChartPointAnnotation"):
            raise ValueError(
                f"Bar chart {compact(chart)} supports ChartPointAnnotation only; got {compact(annotation)}"
            )
        target = one(dataset, annotation, iri(CD, "targetObservation"))
        if target not in observation_ids:
            raise ValueError(
                f"Point annotation {compact(annotation)} targets an observation outside the chart dataset"
            )
        annotations.append({
            "id": compact(annotation),
            "kind": "point",
            "datumId": compact(target),
            "label": selected_literal(dataset, annotation, iri(CD, "body"), "cd:body", language),
            "source": [source_reference(dataset, annotation, "cd:body")],
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
        **({"annotations": annotations} if annotations else {}),
    }
    return payload, label_relation_path



def line_series_payload(dataset: Dataset, chart_dataset: URIRef, language: str) -> dict[str, Any]:
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
    previous_x: float | None = None
    for observation, _position in observation_records:
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
    return {
        "id": compact(chart_dataset), "label": series_label, "data": data,
        "source": [source_reference(dataset, chart_dataset, series_label_path)],
    }


def line_chart_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    chart_dataset = one(dataset, chart, iri(CD, "usesDataset"))
    if not isinstance(chart_dataset, URIRef) or not is_resource_type(dataset, chart_dataset, "Dataset"):
        raise ValueError(f"ChartDefinition {compact(chart)} requires exactly one Dataset")
    series = [line_series_payload(dataset, chart_dataset, language)]
    # Explicit supplemental datasets are authored series, never computed from chart identity.
    parts = sorted((part for part in objects(dataset, chart, DCTERMS.hasPart)
                    if isinstance(part, URIRef) and is_resource_type(dataset, part, "Dataset")), key=str)
    for part in parts:
        if part == chart_dataset:
            raise ValueError("Supplementary line dataset must differ from the primary dataset")
        additional = line_series_payload(dataset, part, language)
        additional["source"].insert(0, source_reference(dataset, chart, "dct:hasPart"))
        series.append(additional)
    owners: dict[str, str] = {}
    for entry in series:
        for datum in entry["data"]:
            if datum["id"] in owners:
                raise ValueError("Line-chart observations must belong to exactly one series")
            owners[datum["id"]] = entry["id"]
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
            "label": selected_literal(dataset, annotation, iri(CD, "body"), "cd:body", language),
            "source": [source_reference(dataset, annotation, "cd:body")],
        }
        if is_resource_type(dataset, annotation, "ChartPointAnnotation"):
            target = one(dataset, annotation, iri(CD, "targetObservation"))
            focus = one(dataset, annotation, iri(CD, "focusSeries"), required=False)
            if focus is not None:
                if not isinstance(focus, Literal) or focus.datatype != XSD.boolean:
                    raise ValueError("Point annotation focusSeries must be a boolean")
                base["focusSeries"] = bool(focus.toPython())
                base["source"].append(source_reference(dataset, annotation, "cd:focusSeries"))
            if compact(target) not in owners:
                raise ValueError(f"Point annotation {compact(annotation)} targets an observation outside the chart dataset")
            annotations.append({**base, "seriesId": owners[compact(target)], "kind": "point", "datumId": compact(target)})
        elif is_resource_type(dataset, annotation, "ChartRangeAnnotation"):
            start_observation = one(dataset, annotation, iri(CD, "startObservation"))
            end_observation = one(dataset, annotation, iri(CD, "endObservation"))
            if compact(start_observation) not in owners or compact(end_observation) not in owners:
                raise ValueError(f"Range annotation {compact(annotation)} targets an observation outside the chart dataset")
            if owners[compact(start_observation)] != owners[compact(end_observation)]:
                raise ValueError("Range annotation endpoints must belong to the same series")
            annotations.append({
                **base,
                "seriesId": owners[compact(start_observation)],
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
        "series": series,
        "annotations": annotations,
    }
    return payload, label_relation_path


def live_chart_update_payload(dataset: Dataset, chart: URIRef) -> dict[str, Any] | None:
    interval_predicate = iri(CD, "liveUpdateIntervalMs")
    amplitude_predicate = iri(CD, "liveJitterAmplitude")
    decimals_predicate = iri(CD, "liveDecimalPlaces")
    interval_value = one(dataset, chart, interval_predicate, required=False)
    amplitude_value = one(dataset, chart, amplitude_predicate, required=False)
    decimals_value = one(dataset, chart, decimals_predicate, required=False)
    values = (interval_value, amplitude_value, decimals_value)
    if all(value is None for value in values):
        return None
    if any(value is None for value in values):
        raise ValueError(f"Live chart metadata is incomplete for {compact(chart)}")
    try:
        interval_ms = int(str(interval_value))
        decimal_places = int(str(decimals_value))
    except (TypeError, ValueError) as error:
        raise ValueError(f"Invalid live chart integer metadata for {compact(chart)}") from error
    jitter_amplitude = decimal_number(dataset, chart, amplitude_predicate)
    if interval_ms < 250:
        raise ValueError(f"Live chart update interval must be >= 250 ms for {compact(chart)}")
    if jitter_amplitude <= 0:
        raise ValueError(f"Live chart jitter amplitude must be positive for {compact(chart)}")
    if decimal_places < 0 or decimal_places > 6:
        raise ValueError(f"Live chart decimal places must be between 0 and 6 for {compact(chart)}")
    return {
        "intervalMs": interval_ms,
        "jitterAmplitude": jitter_amplitude,
        "decimalPlaces": decimal_places,
    }



def media_asset_payload(dataset: Dataset, media: URIRef, language: str | None) -> dict[str, Any]:
    if not is_resource_type(dataset, media, "MediaAsset"):
        raise ValueError(f"MediaRole requires MediaAsset for {compact(media)}")
    uri_value = literal(dataset, media, iri(CD, "uri"))
    media_type = literal(dataset, media, iri(CD, "mediaType"))
    alternative = deterministic_authored_literal(dataset, media, iri(CD, "alternativeText"), language)
    if uri_value is None or media_type is None or alternative is None:
        raise ValueError(f"Incomplete MediaAsset {compact(media)}")
    return {"uri": uri_value, "mediaType": media_type, "alternativeText": alternative}

def dot_plot_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    """Project ordered dataset references; never manufacture observations or statistics."""
    resources_by_id = {}
    def ordered(owner: URIRef, predicate: str) -> list[URIRef]:
        values = objects(dataset, owner, iri(CD, predicate))
        resource_type = "ChartGroup" if predicate == "hasChartGroup" else "Observation"
        if any(not isinstance(value, URIRef) or not is_resource_type(dataset, value, resource_type) for value in values):
            raise ValueError(f"Dot-plot {predicate} requires {resource_type} IRIs")
        records = [(value, integer(dataset, value, iri(CD, "position")))
                   for value in values]
        records.sort(key=lambda record: (record[1], str(record[0])))
        if not records or [position for _, position in records] != list(range(1, len(records) + 1)):
            raise ValueError(f"Dot-plot {predicate} positions must be nonempty, unique and contiguous")
        resources_by_id.update({compact(value): value for value, _ in records})
        return [value for value, _ in records]

    unit = literal(dataset, chart, iri(CD, "yAxisUnit"))
    if not unit:
        raise ValueError("Dot-plot numeric axis requires a unit")
    groups = []
    datasets = set()
    for group in ordered(chart, "hasChartGroup"):
        chart_dataset = one(dataset, group, iri(CD, "usesDataset"))
        if not isinstance(chart_dataset, URIRef) or not is_resource_type(dataset, chart_dataset, "Dataset"):
            raise ValueError("Dot-plot group requires exactly one Dataset")
        if literal(dataset, chart_dataset, iri(CD, "unit")) != unit:
            raise ValueError("Dot-plot dataset unit must match numeric axis")
        datasets.add(chart_dataset)
        label, label_path = selected_label_reference(dataset, group, language)
        groups.append({
            "id": compact(group), "label": label,
            "source": [source_reference(dataset, group, label_path),
                       source_reference(dataset, group, "cd:usesDataset"),
                       source_reference(dataset, chart_dataset, "cd:unit")],
            "data": [{"id": compact(observation),
                      "value": decimal_number(dataset, observation, iri(CD, "numericValue")),
                      "source": [source_reference(dataset, observation, "cd:numericValue"),
                                 source_reference(dataset, chart_dataset, "cd:hasObservation")]}
                      for observation in ordered(chart_dataset, "hasObservation")],
        })
        interval=one(dataset,group,iri(CD,"displayInterval"),required=False)
        if interval is not None:
            if not isinstance(interval,URIRef) or not is_resource_type(dataset,interval,"ObservationInterval") or literal(dataset,interval,iri(CD,"unit"))!=unit:raise ValueError("Display intervals require typed, same-unit bounds")
            lower,upper=[decimal_number(dataset,interval,iri(CD,p)) for p in ("lowerBound","upperBound")]
            if lower>upper:raise ValueError("Interval lower bound exceeds upper bound")
            groups[-1]["interval"]={"id":compact(interval),"label":selected_label_reference(dataset,interval,language)[0],"lower":lower,"upper":upper,"source":[source_reference(dataset,group,"cd:displayInterval"),source_reference(dataset,interval,"cd:lowerBound"),source_reference(dataset,interval,"cd:upperBound"),source_reference(dataset,interval,"cd:unit")]}
        if one(dataset, group, iri(CD, "groupXValue"), required=False) is not None:
            groups[-1]["x"] = decimal_number(dataset, group, iri(CD, "groupXValue"))
            groups[-1]["source"].append(source_reference(dataset, group, "cd:groupXValue"))
        summary = one(dataset, group, iri(CD, "summaryResult"), required=False)
        if summary is not None:
            if not is_resource_type(dataset, summary, "StatisticalResult"):
                raise ValueError("Group summary requires a StatisticalResult")
            if set(objects(dataset, summary, iri(CD, "usesDataset"))) != {chart_dataset}:
                raise ValueError("Group summary must reference exactly its observed dataset")
            if literal(dataset, summary, iri(CD, "unit")) != unit:
                raise ValueError("Group summary unit must match numeric axis")
            groups[-1]["summary"] = {
                "id": compact(summary), "label": literal(dataset, chart, iri(CD, "summaryLabel")) or "Group summary",
                "value": decimal_number(dataset, summary, iri(CD, "numericValue")),
                "source": [source_reference(dataset, group, "cd:summaryResult"),
                           source_reference(dataset, summary, "cd:numericValue"),
                           source_reference(dataset, summary, "cd:usesDataset")],
            }
    annotations = objects(dataset, chart, iri(CD, "hasChartAnnotation"))
    if len(annotations) > 1:
        raise ValueError("Dot plot supports at most one shared reference line")
    reference = None
    if annotations:
        annotation = annotations[0]
        if not is_resource_type(dataset, annotation, "ChartReferenceLine"):
            raise ValueError("Dot plot requires a reference-line annotation")
        result = one(dataset, annotation, iri(CD, "referenceResult"))
        if not is_resource_type(dataset, result, "StatisticalResult"):
            raise ValueError("Reference line requires a StatisticalResult")
        statistic = one(dataset, result, iri(CD, "quantifiesProperty"))
        if not is_resource_type(dataset, statistic, "Concept"):
            raise ValueError("StatisticalResult requires a statistic concept")
        if literal(dataset, result, iri(CD, "unit")) != unit:
            raise ValueError("Reference result unit must match numeric axis")
        if set(objects(dataset, result, iri(CD, "usesDataset"))) != datasets:
            raise ValueError("Reference result must be supported by exactly the plotted datasets")
        reference = {
            "id": compact(annotation), "label": selected_literal(dataset, annotation, iri(CD, "body"), "cd:body", language),
            "value": decimal_number(dataset, result, iri(CD, "numericValue")),
            "source": [source_reference(dataset, annotation, "cd:referenceResult"),
                       source_reference(dataset, result, "cd:numericValue"),
                       source_reference(dataset, result, "cd:unit"),
                       source_reference(dataset, result, "cd:quantifiesProperty"),
                       source_reference(dataset, result, "cd:usesDataset")],
        }
    label, label_path = selected_label_reference(dataset, chart, language)
    options = {}
    if str(one(dataset, chart, iri(CD, "drawStems"), required=False)).lower() == "true":
        if reference is None or str(one(dataset, chart, iri(CD, "numericXAxis"), required=False)).lower() == "true":
            raise ValueError("Categorical stems require a shared reference and categorical x axis")
        options["drawStems"] = True
        for group in groups:
            for datum in group["data"]:
                resource = resources_by_id[datum["id"]]
                datum["label"], path = selected_label_reference(dataset, resource, language)
                datum["source"].append(source_reference(dataset, resource, path))
    for predicate, key in [("yAxisMinimum", "yMinimum"), ("markerRadius", "markerRadius"),
                           ("markerOpacity", "markerOpacity"), ("summaryRadius", "summaryRadius")]:
        if one(dataset, chart, iri(CD, predicate), required=False) is not None:
            options[key] = decimal_number(dataset, chart, iri(CD, predicate))
    for predicate in ["observationLabel", "summaryLabel"]:
        value = literal(dataset, chart, iri(CD, predicate))
        if value: options[predicate] = value
    numeric = one(dataset, chart, iri(CD, "numericXAxis"), required=False)
    if numeric is not None and str(numeric).lower() == "true":
        if any("x" not in group for group in groups):
            raise ValueError("Numeric scatterplot requires groupXValue for every group")
        options["xScale"] = "linear"
    curves = [line_series_payload(dataset, part, language) for part in sorted(objects(dataset, chart, DCTERMS.hasPart), key=str)
              if isinstance(part, URIRef) and is_resource_type(dataset, part, "Dataset")]
    if curves:
        if "xScale" not in options: raise ValueError("Curve overlay requires numeric x-axis")
        for part in objects(dataset, chart, DCTERMS.hasPart):
            if isinstance(part, URIRef) and is_resource_type(dataset, part, "Dataset") and literal(dataset, part, iri(CD, "unit")) != unit:
                raise ValueError("Curve dataset unit must match numeric axis")
        options["curves"] = curves
    for key in ["markerRadius", "summaryRadius"]:
        if key in options and not 0 < options[key] <= 20: raise ValueError("Invalid dot marker radius")
    if "markerOpacity" in options and not 0 < options["markerOpacity"] <= 1: raise ValueError("Invalid dot marker opacity")
    values = [point["value"] for group in groups for point in group["data"]]
    values += [group["summary"]["value"] for group in groups if "summary" in group]
    values += [point["y"] for curve in curves for point in curve["data"]]
    if reference: values.append(reference["value"])
    if "yMinimum" in options and min(values) < options["yMinimum"]:
        raise ValueError("Authored y minimum must not clip chart data")
    return {
        "chartType": "dot", "label": label,
        "description": selected_literal(dataset, chart, iri(CD, "body"), "cd:body", language),
        "xAxis": {"label": selected_literal(dataset, chart, iri(CD, "xAxisLabel"), "cd:xAxisLabel", language)},
        "yAxis": {"label": selected_literal(dataset, chart, iri(CD, "yAxisLabel"), "cd:yAxisLabel", language), "unit": unit},
        "groups": groups,
        **({"referenceLine": reference} if reference else {}),
        **options,
    }, label_path


def observation_explorer_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    def sequence(subject, predicate):
        values = sorted(set(objects(dataset, subject, predicate)), key=lambda item: integer(dataset, item, iri(CD, "position")))
        if [integer(dataset, item, iri(CD, "position")) for item in values] != list(range(1, len(values) + 1)):
            raise ValueError("Observation presentation positions must be unique and contiguous")
        return values
    view = literal(dataset, chart, iri(CD, "observationView"))
    if view not in ("compare", "order", "count", "ecdf", "summary", "moments"):
        raise ValueError("Unsupported observation view")
    series = []
    units = set()
    for resource in sequence(chart, iri(CD, "hasObservationSeries")):
        if not is_resource_type(dataset, resource, "ObservationSeries"):
            raise ValueError("Observation series must have explicit type")
        source_dataset = one(dataset, resource, iri(CD, "usesDataset"))
        if not is_resource_type(dataset, source_dataset, "Dataset"):
            raise ValueError("Observation series requires a Dataset")
        units.add(literal(dataset, source_dataset, iri(CD, "unit")))
        data = []
        for placement in sequence(resource, iri(CD, "hasObservationPlacement")):
            if not is_resource_type(dataset, placement, "ObservationPlacement"):
                raise ValueError("Presentation placement must have explicit type")
            observation = one(dataset, placement, iri(CD, "placedObservation"))
            if observation not in objects(dataset, source_dataset, iri(CD, "hasObservation")):
                raise ValueError("Observation placement refers outside its dataset")
            if not is_resource_type(dataset, observation, "Observation"):
                raise ValueError("Observation placement requires an Observation")
            data.append({"id": compact(observation), "value": decimal_number(dataset, observation, iri(CD, "numericValue")),
                         "label": f'O{integer(dataset, observation, iri(CD, "position"))}',
                         "source": [source_reference(dataset, observation, "cd:numericValue"),
                                    source_reference(dataset, observation, "cd:position"),
                                    source_reference(dataset, placement, "cd:placedObservation")]})
        if not data or len({d["id"] for d in data}) != len(data) or {d["id"] for d in data} != {compact(o) for o in objects(dataset, source_dataset, iri(CD, "hasObservation"))}:
            raise ValueError("Presentation must retain every dataset observation exactly once")
        label, label_path = selected_label_reference(dataset, resource, language)
        series.append({"id": compact(resource), "datasetId": compact(source_dataset), "label": label, "data": data,
                       "source": [source_reference(dataset, resource, label_path), source_reference(dataset, resource, "cd:usesDataset")]})
        if view == "summary":
            summaries = {}
            for key, relation, property_name in (("mean", "comparisonCenter", "arithmetic-mean"), ("variance", "comparisonVariance", "sample-variance"), ("sd", "comparisonSpread", "sample-standard-deviation")):
                result = one(dataset, resource, iri(CD, relation))
                if not is_resource_type(dataset, result, "StatisticalResult") or source_dataset not in objects(dataset, result, iri(CD, "usesDataset")) or one(dataset, result, iri(CD, "quantifiesProperty")) != iri(EX, property_name):
                    raise ValueError("Comparison result must quantify the declared statistic of the plotted dataset")
                result_unit = literal(dataset, result, iri(CD, "unit"))
                expected_unit = "(" + literal(dataset, source_dataset, iri(CD, "unit")) + ")^2" if key == "variance" else literal(dataset, source_dataset, iri(CD, "unit"))
                if result_unit != expected_unit:
                    raise ValueError("Comparison result has inconsistent units")
                value = decimal_number(dataset, result, iri(CD, "numericValue"))
                if key != "mean" and value < 0:
                    raise ValueError("Comparison dispersion must be nonnegative")
                summaries[key] = {"id": compact(result), "label": selected_literal(dataset, result, SKOS.prefLabel, "skos:prefLabel", language), "value": value, "unit": result_unit,
                                  "propertyId": compact(iri(EX, property_name)), "source": [source_reference(dataset, resource, "cd:" + relation), source_reference(dataset, result, "cd:numericValue"), source_reference(dataset, result, "cd:quantifiesProperty"), source_reference(dataset, result, "skos:prefLabel"), source_reference(dataset, result, "cd:unit")]}
            series[-1]["summaries"] = summaries
    if not series or (view not in ("compare", "summary", "ecdf", "moments") and len(series) != 1) or (view == "summary" and len(series) < 2):
        raise ValueError("Observation view has invalid series count")
    unit = literal(dataset, chart, iri(CD, "xAxisUnit"))
    if not unit or units != {unit}:
        raise ValueError("Observation series and numeric axis must have identical units")
    label, label_path = selected_label_reference(dataset, chart, language)
    payload = {"chartType": "observations", "view": view, "label": label,
               "description": selected_literal(dataset, chart, iri(CD, "body"), "cd:body", language),
               "xAxis": {"label": selected_literal(dataset, chart, iri(CD, "xAxisLabel"), "cd:xAxisLabel", language), "unit": unit},
               "yAxis": {"label": selected_literal(dataset, chart, iri(CD, "yAxisLabel"), "cd:yAxisLabel", language)}, "series": series}
    metric=literal(dataset,chart,iri(CD,"momentMetric"))
    if view=="moments":
        if metric not in ("mean","variance","kurtosis","skewness") or len(series)>6 or any(len(s["data"])<2 for s in series):raise ValueError("Moment view requires a known metric and 1–6 nontrivial series")
        payload["momentMetric"]=metric
    elif metric:raise ValueError("Moment metric requires a moment view")
    compact_display=one(dataset,chart,iri(CD,"compactObservations"),required=False)
    if compact_display is not None:
        if view!="ecdf" or not isinstance(compact_display,Literal) or compact_display.datatype!=URIRef("http://www.w3.org/2001/XMLSchema#boolean"):raise ValueError("Compact observation display requires an ECDF and boolean")
        payload["compact"]=compact_display.toPython()
    interactive_display=one(dataset,chart,iri(CD,"interactiveObservations"),required=False)
    if interactive_display is not None:
        if view!="ecdf" or not isinstance(interactive_display,Literal) or interactive_display.datatype!=URIRef("http://www.w3.org/2001/XMLSchema#boolean") or not payload.get("compact"):raise ValueError("Static ECDF option requires a compact ECDF and boolean")
        payload["interactive"]=interactive_display.toPython()
    if view == "summary":
        minimum, maximum, lower, upper = [decimal_number(dataset, chart, iri(CD, p)) for p in ("comparisonMinimum", "comparisonMaximum", "intervalLower", "intervalUpper")]
        if not minimum <= lower <= upper <= maximum or minimum >= maximum or any(d["value"] < minimum or d["value"] > maximum for s in series for d in s["data"]):
            raise ValueError("Invalid comparison domain or interval")
        stages = []
        for stage in sequence(chart, iri(CD, "hasComparisonStage")):
            mode = literal(dataset, stage, iri(CD, "comparisonMode"))
            if not is_resource_type(dataset, stage, "ComparisonStage") or mode not in ("observations", "mean", "spread", "summaries", "overlay", "rank", "interval", "mirror", "topics", "distribution"):
                raise ValueError("Invalid comparison stage")
            record = {"id": compact(stage), "mode": mode, "label": selected_literal(dataset, stage, SKOS.prefLabel, "skos:prefLabel", language),
                      "prompt": selected_literal(dataset, stage, iri(CD, "body"), "cd:body", language),
                      "source": [source_reference(dataset, stage, "cd:comparisonMode"), source_reference(dataset, stage, "cd:body"), source_reference(dataset, stage, "skos:prefLabel")]}
            topics = sequence(stage, iri(CD, "hasKeyPoint"))
            if topics:
                record["topics"] = [{"text": selected_literal(dataset, topic, iri(CD, "body"), "cd:body", language), "source": [source_reference(dataset, topic, "cd:body")]} for topic in topics]
            overlay = one(dataset, stage, iri(CD, "allowSeriesOverlay"), required=False)
            if overlay is not None:
                if not isinstance(overlay, Literal) or not isinstance(overlay.toPython(), bool):
                    raise ValueError("Overlay permission must be boolean")
                record["allowOverlay"] = overlay.toPython()
                record["source"].append(source_reference(dataset, stage, "cd:allowSeriesOverlay"))
            probes = sequence(stage, iri(CD, "hasInvestigation"))
            if probes:
                record["investigations"] = []
                for probe in probes:
                    probe_mode = literal(dataset, probe, iri(CD, "comparisonMode"))
                    if not is_resource_type(dataset, probe, "ComparisonStage") or probe_mode not in ("rank", "interval", "mirror") or objects(dataset, probe, iri(CD, "hasInvestigation")):
                        raise ValueError("Invalid optional investigation")
                    record["investigations"].append({"id": compact(probe), "mode": probe_mode,
                        "label": selected_literal(dataset, probe, SKOS.prefLabel, "skos:prefLabel", language),
                        "prompt": selected_literal(dataset, probe, iri(CD, "body"), "cd:body", language),
                        "source": [source_reference(dataset, stage, "cd:hasInvestigation"), source_reference(dataset, probe, "cd:comparisonMode"), source_reference(dataset, probe, "cd:body"), source_reference(dataset, probe, "skos:prefLabel")]})
            stages.append(record)
        if not stages:
            raise ValueError("Summary comparison requires authored stages")
        details = []
        for part in objects(dataset, chart, DCTERMS.hasPart):
            if is_resource_type(dataset, part, "MathExpression"):
                details.append({"expression": literal(dataset, part, iri(CD, "latex")), "source": [source_reference(dataset, part, "cd:latex")]})
            elif any(is_resource_type(dataset, part, kind) for kind in ("Definition", "WorkedExample", "Interpretation")):
                details.append({"text": selected_literal(dataset, part, iri(CD, "body"), "cd:body", language), "source": [source_reference(dataset, part, "cd:body")]})
            else:
                raise ValueError("Unsupported comparison detail resource")
        payload["comparison"] = {"minimum": minimum, "maximum": maximum, "interval": [lower, upper], "stages": stages, "details": details}
    threshold_predicates = ("thresholdMinimum", "thresholdMaximum", "thresholdInitial", "thresholdStep")
    if view in ("count", "ecdf"):
        minimum, maximum, initial, step = [decimal_number(dataset, chart, iri(CD, p)) for p in threshold_predicates]
        values = [d["value"] for s in series for d in s["data"]]
        if not minimum < min(values) <= max(values) < maximum or not minimum <= initial <= maximum or step <= 0:
            raise ValueError("Threshold domain must include both tails, a valid initial value and positive step")
        payload["threshold"] = {"minimum": minimum, "maximum": maximum, "initial": initial, "step": step}
    elif any(objects(dataset, chart, iri(CD, p)) for p in threshold_predicates):
        raise ValueError("Only counting and ECDF views permit thresholds")
    definition = one(dataset, chart, iri(CD, "formalDefinition"), required=False)
    expression = one(dataset, chart, iri(CD, "formalExpression"), required=False)
    if definition or expression:
        if view != "ecdf" or not isinstance(definition, URIRef) or not isinstance(expression, URIRef) or not is_resource_type(dataset, definition, "Definition") or not is_resource_type(dataset, expression, "MathExpression"):
            raise ValueError("Formalization requires an ECDF view and canonical definition/expression pair")
        text = selected_literal(dataset, definition, iri(CD, "body"), "cd:body", language)
        payload["formal"] = {"definition": text, "expression": literal(dataset, expression, iri(CD, "latex")), "spokenText": text,
                             "source": [source_reference(dataset, chart, "cd:formalDefinition"), source_reference(dataset, chart, "cd:formalExpression"),
                                        source_reference(dataset, definition, "cd:body"), source_reference(dataset, expression, "cd:latex")]}
    return payload, label_path


def histogram_payload(dataset: Dataset, chart: URIRef, language: str, two_dimensional: bool) -> tuple[dict[str, Any], str | None]:
    def edge_list(predicate):
        node=one(dataset,chart,iri(CD,predicate));seen=set();values=[]
        while node != RDF.nil:
            if node in seen or len(values)>513:raise ValueError("Invalid histogram edge list")
            seen.add(node);value=one(dataset,node,RDF.first)
            if not isinstance(value,Literal):raise ValueError("Histogram edges must be numeric literals")
            values.append(float(value));node=one(dataset,node,RDF.rest)
        return values
    data_id=one(dataset,chart,iri(CD,"usesDataset"))
    if not isinstance(data_id,URIRef) or not is_resource_type(dataset,data_id,"Dataset"):raise ValueError("Histogram requires one Dataset")
    unit=literal(dataset,data_id,iri(CD,"unit"))
    if not unit or literal(dataset,chart,iri(CD,"xAxisUnit"))!=unit:raise ValueError("Histogram dataset and numeric x-axis units must match")
    observations=objects(dataset,data_id,iri(CD,"hasObservation"))
    if any(not isinstance(o,URIRef) or not is_resource_type(dataset,o,"Observation") for o in observations):raise ValueError("Histogram requires canonical observations")
    observations.sort(key=lambda o:integer(dataset,o,iri(CD,"position")))
    if [integer(dataset,o,iri(CD,"position")) for o in observations] != list(range(1,len(observations)+1)):raise ValueError("Histogram positions must be contiguous")
    label,label_path=selected_label_reference(dataset,chart,language)
    payload={"chartType":"histogram2d" if two_dimensional else "histogram","label":label,"description":selected_literal(dataset,chart,iri(CD,"body"),"cd:body",language),
        "xAxis":{"label":selected_literal(dataset,chart,iri(CD,"xAxisLabel"),"cd:xAxisLabel",language),"unit":unit},
        "yAxis":{"label":selected_literal(dataset,chart,iri(CD,"yAxisLabel"),"cd:yAxisLabel",language)},"edges":edge_list("binEdges"),
        "data":[{"id":compact(o),"value":decimal_number(dataset,o,iri(CD,"numericValue")),"source":[source_reference(dataset,o,"cd:numericValue"),source_reference(dataset,data_id,"cd:hasObservation")]} for o in observations]}
    y_unit=literal(dataset,chart,iri(CD,"yAxisUnit"))
    if y_unit:payload["yAxis"]["unit"]=y_unit
    if two_dimensional:
        if not y_unit or literal(dataset,data_id,iri(CD,"yMeasurementUnit"))!=y_unit:raise ValueError("2D histogram y units must match")
        payload["yEdges"]=edge_list("yBinEdges")
        for item,o in zip(payload["data"],observations):
            item["y"]=decimal_number(dataset,o,iri(CD,"pairedValue"));item["source"].append(source_reference(dataset,o,"cd:pairedValue"))
        histogram_cells(payload["data"],payload["edges"],payload["yEdges"])
    else:
        payload["normalization"]=literal(dataset,chart,iri(CD,"histogramNormalization"))
        histogram_bins([d["value"] for d in payload["data"]],payload["edges"],payload["normalization"])
        adjust=one(dataset,chart,iri(CD,"allowBinAdjustment"),required=False)
        if adjust is not None:
            if not isinstance(adjust,Literal) or adjust.toPython() is not True:raise ValueError("Bin adjustment requires explicit true")
            minimum,maximum,step=[decimal_number(dataset,chart,iri(CD,p)) for p in ("binWidthMinimum","binWidthMaximum","binWidthStep")]
            width=payload["edges"][1]-payload["edges"][0]
            from histogram_statistics import equal_width
            if minimum<=0 or maximum<minimum or step<=0 or not minimum<=width<=maximum or (payload["edges"][-1]-payload["edges"][0])/minimum>510 or not equal_width(payload["edges"]):raise ValueError("Invalid histogram adjustment bounds")
            payload["binAdjustment"]={"minimumWidth":minimum,"maximumWidth":maximum,"widthStep":step}
    return payload,label_path


def timeline_chart_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    """Expand authored periodic lane schedules; no TED identities or hidden timings."""
    def ordered(values, expected_type):
        if any(not isinstance(v, URIRef) or not is_resource_type(dataset, v, expected_type) for v in values):
            raise ValueError(f"Timeline requires {expected_type} IRIs")
        records = sorted([(v, integer(dataset, v, iri(CD, "position"))) for v in values], key=lambda r: (r[1], str(r[0])))
        if not records or [p for _, p in records] != list(range(1, len(records) + 1)):
            raise ValueError("Timeline positions must be nonempty, unique and contiguous")
        return [v for v, _ in records]

    def identity(resource):
        label, label_path = selected_label_reference(dataset, resource, language)
        return {"id": compact(resource), "label": label, "source": [source_reference(dataset, resource, label_path), source_reference(dataset, resource, "cd:position")]}

    def number(resource, predicate, positive=False):
        value = decimal_number(dataset, resource, iri(CD, predicate))
        if not math.isfinite(value) or value < 0 or (positive and value == 0):
            raise ValueError(f"Invalid timeline {predicate}")
        return value

    categories = ordered(objects(dataset, chart, iri(CD, "hasTimelineCategory")), "TimelineCategory")
    runs = ordered(objects(dataset, chart, iri(CD, "hasTimelineRun")), "TimelineRun")
    primary = one(dataset, chart, iri(CD, "usesDataset"))
    schedules = ordered([primary, *objects(dataset, chart, DCTERMS.hasPart)], "TimelineSchedule")
    scenarios = []
    for schedule in schedules:
        lanes = []
        for lane in ordered(objects(dataset, schedule, iri(CD, "hasTimelineLane")), "TimelineLane"):
            offset, period = number(lane, "startOffset"), number(lane, "repeatEvery", True)
            intervals = []
            phases = ordered(objects(dataset, lane, iri(CD, "hasTimelineInterval")), "TimelineInterval")
            for run_index, run in enumerate(runs):
                previous_end = -1
                for phase in phases:
                    start, duration = number(phase, "startOffset"), number(phase, "duration", True)
                    category = one(dataset, phase, iri(CD, "intervalCategory"))
                    if category not in categories or start < previous_end or start + duration > period:
                        raise ValueError("Timeline phases must use chart categories, be ordered, non-overlapping and fit their repeat period")
                    previous_end = start + duration
                    interval = {"id": f"{compact(lane)}--{compact(run)}--{compact(phase)}",
                                "label": identity(run)["label"], "start": offset + run_index * period + start,
                                "end": offset + run_index * period + start + duration, "categoryId": compact(category),
                                "source": [source_reference(dataset, resource, relation) for resource, relation in
                                           ((lane, "cd:startOffset"), (lane, "cd:repeatEvery"), (lane, "cd:hasTimelineInterval"),
                                            (phase, "cd:startOffset"), (phase, "cd:duration"), (phase, "cd:intervalCategory"),
                                            (run, "cd:position"), (run, "skos:prefLabel@" + language))]}
                    intervals.append(interval)
            lanes.append({**identity(lane), "intervals": intervals})
        scenario = {**identity(schedule), "lanes": lanes}
        scenario["source"].append(source_reference(dataset, schedule, "cd:hasTimelineLane"))
        scenarios.append(scenario)
    label, label_path = selected_label_reference(dataset, chart, language)
    unit = literal(dataset, chart, iri(CD, "xAxisUnit"))
    if not unit:
        raise ValueError("Timeline requires a time-axis unit")
    return {"chartType": "timeline", "label": label,
            "description": selected_literal(dataset, chart, iri(CD, "body"), "cd:body", language),
            "xAxis": {"label": selected_literal(dataset, chart, iri(CD, "xAxisLabel"), "cd:xAxisLabel", language), "unit": unit},
            "yAxis": {"label": selected_literal(dataset, chart, iri(CD, "yAxisLabel"), "cd:yAxisLabel", language)},
            "categories": [identity(c) for c in categories], "scenarios": scenarios}, label_path


def chart_payload(dataset: Dataset, chart: URIRef, language: str) -> tuple[dict[str, Any], str | None]:
    chart_type = one(dataset, chart, iri(CD, "chartType"))
    if chart_type == iri(CD, "TimelineChart"):
        return timeline_chart_payload(dataset, chart, language)
    if chart_type == iri(CD, "ObservationExplorer"):
        return observation_explorer_payload(dataset, chart, language)
    if chart_type == iri(CD, "DotPlot"):
        return dot_plot_payload(dataset, chart, language)
    if chart_type in (iri(CD,"Histogram"),iri(CD,"Histogram2D")):
        return histogram_payload(dataset,chart,language,chart_type==iri(CD,"Histogram2D"))
    if chart_type == iri(CD, "BoxPlot"):
        if set(objects(dataset, chart, iri(CD, "dependsOn"))) != {iri(EX, "sample-quantile-type-7")}:
            raise ValueError("Box plots require an explicit type-7 quantile method")
        multiplier = decimal_number(dataset, chart, iri(CD, "fenceMultiplier"))
        if multiplier < 0:
            raise ValueError("Box plot fence multiplier must be nonnegative")
        payload, label_path = dot_plot_payload(dataset, chart, language)
        if set(payload) - {"chartType", "label", "description", "xAxis", "yAxis", "groups", "yMinimum"} or any(set(g) - {"id", "label", "source", "data"} for g in payload["groups"]):
            raise ValueError("Box plots only support categorical dataset groups, without dot-specific options")
        show=one(dataset,chart,iri(CD,"showObservations"),required=False)
        if show is not None and (not isinstance(show,Literal) or show.datatype!=URIRef("http://www.w3.org/2001/XMLSchema#boolean")):raise ValueError("showObservations must be boolean")
        return {**payload, "chartType": "box", "quantileMethod": "type7", "fenceMultiplier": multiplier, **({"showObservations":show.toPython()} if show is not None else {})}, label_path
    if chart_type == iri(CD, "BarChart"):
        payload, relation_path = bar_chart_payload(dataset, chart, language)
    elif chart_type == iri(CD, "LineChart"):
        payload, relation_path = line_chart_payload(dataset, chart, language)
    else:
        raise ValueError(f"Unsupported chart type for {compact(chart)}: {compact(chart_type)}")
    live_update = live_chart_update_payload(dataset, chart)
    if live_update is not None:
        payload["liveUpdate"] = live_update
    return payload, relation_path

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


def promote_document_version(current: str, required: str) -> str:
    versions = {"1.0": 0, "1.1": 1, "1.2": 2, "1.3": 3, "1.4": 4, "1.5": 5, "1.6": 6, "1.7": 7, "1.8": 8, "1.9": 9, "1.10": 10, "1.11": 11, "1.12":12, "1.13":13}
    return required if versions[required] > versions[current] else current


def mathematical_symbol_entries(dataset: Dataset, symbols: set[URIRef], language: str) -> list[dict[str, Any]]:
    result = []
    for symbol in sorted(symbols, key=lambda s: (literal(dataset, s, iri(CD, "symbol")) or str(s), str(s))):
        if not is_resource_type(dataset, symbol, "MathSymbol"):
            continue
        term = literal(dataset, symbol, iri(CD, "symbol"))
        predicate = "presentationDefinition" if objects(dataset, symbol, iri(CD, "presentationDefinition")) else "body"
        description = selected_literal(dataset, symbol, iri(CD, predicate), f"cd:{predicate}", language)
        if not term or not description: raise ValueError(f"Symbol requires a name and a definition: {symbol}")
        notation = literal(dataset, symbol, iri(CD, "mathNotation")) or term
        result.append({"id": f"{compact(symbol)}--symbol-entry", "symbol": True, "expression": notation, "term": term, "description": description,
                       "source": [source_reference(dataset, symbol, "cd:symbol"), source_reference(dataset, symbol, f"cd:{predicate}")]
                       + ([source_reference(dataset, symbol, "cd:mathNotation")] if objects(dataset, symbol, iri(CD, "mathNotation")) else [])})
    return result


def mathematical_derivation_payload(dataset: Dataset, section: URIRef, language: str) -> dict[str, Any]:
    """Resolve authored identities and contiguous ranges; never infer algebra from LaTeX."""
    def required_type(resource: URIRef, kind: str) -> None:
        if not isinstance(resource, URIRef) or not is_resource_type(dataset, resource, kind):
            raise ValueError(f"Expected {kind}: {resource}")

    def formula(resource: URIRef) -> dict[str, Any]:
        required_type(resource, "MathExpression")
        expression = literal(dataset, resource, iri(CD, "latex"))
        if not expression or not objects(dataset, resource, iri(CD, "hasSymbol")):
            raise ValueError(f"Derivation formulas need LaTeX and symbol references: {resource}")
        label_text = deterministic_authored_literal(dataset, resource, iri(CD, "formulaLabel"), language)
        return {"id": compact(resource), "expression": expression, **({"label": label_text} if label_text else {}),
                "source": [source_reference(dataset, resource, "cd:latex"), source_reference(dataset, resource, "cd:hasSymbol")]
                + ([source_reference(dataset, resource, "cd:formulaLabel")] if label_text else [])}

    def label(resource: URIRef) -> str:
        return selected_label_reference(dataset, resource, language)[0]

    required_type(section, "MathematicalDerivationSection")
    owner = one(dataset, section, iri(CD, "partOfDerivation"))
    required_type(owner, "MathematicalDerivation")
    steps = sorted(objects(dataset, owner, iri(CD, "hasDerivationStep")),
                   key=lambda step: (integer(dataset, step, iri(CD, "position")), str(step)))
    if not steps or [integer(dataset, step, iri(CD, "position")) for step in steps] != list(range(1, len(steps) + 1)):
        raise ValueError("Derivation step positions must be unique and contiguous")
    previous = one(dataset, owner, iri(CD, "inputFormula"))
    for step in steps:
        required_type(step, "DerivationStep")
        if one(dataset, step, iri(CD, "fromFormula")) != previous:
            raise ValueError("Disconnected derivation formulas")
        if set(objects(dataset, step, iri(CD, "hasDerivationStep"))):
            raise ValueError("Derivation steps cannot recursively own steps")
        previous = one(dataset, step, iri(CD, "toFormula"))
    if previous != one(dataset, owner, iri(CD, "resultFormula")):
        raise ValueError("Derivation result does not match the final step")
    first = one(dataset, section, iri(CD, "firstDerivationStep"))
    last = one(dataset, section, iri(CD, "lastDerivationStep"))
    if first not in steps or last not in steps:
        raise ValueError("Derivation section endpoints must belong to its derivation")
    a, b = steps.index(first), steps.index(last)
    if a > b or b - a > 1:
        raise ValueError("Use explicit contiguous derivation sections of one or two steps; do not shrink formulas")
    legend_resource = one(dataset, section, iri(CD, "usesLegend"))
    entries = definition_list_sequence(dataset, legend_resource, language)
    defined_symbols = {symbol for entry, *_ in entries for symbol in objects(dataset, entry, DCTERMS.references)}
    output = []
    kinds = {"EquivalentTransformation": "equivalence", "ImpliedTransformation": "implication", "StatisticalTransformation": "statistical"}
    for step in steps[a:b + 1]:
        rule = one(dataset, step, iri(CD, "appliesRule"))
        required_type(rule, "MathematicalRule")
        general = one(dataset, rule, iri(CD, "ruleFormula"))
        explanation = one(dataset, step, iri(CD, "hasExplanation"))
        required_type(explanation, "Interpretation")
        application = one(dataset, explanation, iri(CD, "applicationFormula"))
        start, end = one(dataset, step, iri(CD, "fromFormula")), one(dataset, step, iri(CD, "toFormula"))
        used_symbols = {symbol for f in [start, end, general] for symbol in objects(dataset, f, iri(CD, "hasSymbol"))}
        if not used_symbols.issubset(defined_symbols):
            raise ValueError(f"Incomplete derivation symbol legend: {sorted(str(s) for s in used_symbols - defined_symbols)}")
        kind_resource = one(dataset, step, iri(CD, "transformationKind"))
        kind = kinds.get(local_name(kind_resource))
        if kind is None: raise ValueError("Unknown derivation transformation kind")
        own_assumptions = objects(dataset, step, iri(CD, "requiresAssumption"))
        if kind == "statistical" and not own_assumptions:
            raise ValueError("Statistical transformations require explicit assumptions")
        assumptions = sorted(set(own_assumptions + objects(dataset, rule, iri(CD, "requiresAssumption"))
                                 + objects(dataset, owner, iri(CD, "requiresAssumption"))), key=str)
        assumption_payload = []
        for assumption in assumptions:
            required_type(assumption, "Interpretation")
            assumption_payload.append({"id": compact(assumption), "label": label(assumption),
                "description": selected_literal(dataset, assumption, iri(CD, "body"), "cd:body", language),
                "source": [source_reference(dataset, assumption, "cd:body")]})
        output.append({"id": compact(step), "order": integer(dataset, step, iri(CD, "position")),
            "from": formula(start), "to": formula(end), "operation": label(step), "kind": kind, "kindLabel": label(kind_resource),
            "rule": {"id": compact(rule), "label": label(rule), "formula": formula(general),
                     "description": selected_literal(dataset, rule, iri(CD, "body"), "cd:body", language),
                     "source": [source_reference(dataset, rule, "cd:ruleFormula"), source_reference(dataset, rule, "cd:body")]},
            "explanation": {"id": compact(explanation), "text": selected_literal(dataset, explanation, iri(CD, "body"), "cd:body", language),
                            "application": formula(application), "source": [source_reference(dataset, explanation, "cd:body"), source_reference(dataset, explanation, "cd:applicationFormula")]},
            "assumptions": assumption_payload,
            "source": [source_reference(dataset, step, predicate) for predicate in ["cd:fromFormula", "cd:toFormula", "cd:appliesRule", "cd:hasExplanation", "cd:position", "cd:transformationKind"]]})
    visible_symbols = {symbol for step in steps[a:b + 1] for p in ["fromFormula", "toFormula"]
                       for f in objects(dataset, step, iri(CD, p)) for symbol in objects(dataset, f, iri(CD, "hasSymbol"))}
    return {"id": compact(section), "derivationId": compact(owner), "label": label(owner), "firstOrder": a + 1, "lastOrder": b + 1,
            "steps": output, "legend": mathematical_symbol_entries(dataset, visible_symbols, language) or [{"id": compact(entry), "term": term, "description": description,
                 "source": [source_reference(dataset, entry, term_path), source_reference(dataset, entry, "cd:body")]} for entry, _p, term, term_path, description, _v, _r in entries],
            "source": [source_reference(dataset, section, "cd:partOfDerivation"), source_reference(dataset, section, "cd:firstDerivationStep"), source_reference(dataset, section, "cd:lastDerivationStep"), source_reference(dataset, section, "cd:usesLegend")]}


def mathematical_derivation_details(dataset: Dataset, resource: URIRef, language: str) -> list[dict[str, Any]]:
    """Explicit proof links reuse authored short sections without creating scenes."""
    output = []
    for owner in sorted(set(objects(dataset, resource, iri(CD, "hasDerivationDetail"))), key=str):
        if not is_resource_type(dataset, owner, "MathematicalDerivation"):
            raise ValueError(f"Derivation detail must resolve to a MathematicalDerivation: {owner}")
        sections = {s for s, _p, _o, _g in dataset.quads((None, iri(CD, "partOfDerivation"), owner, None))
                    if is_resource_type(dataset, s, "MathematicalDerivationSection")}
        payloads = sorted((mathematical_derivation_payload(dataset, s, language) for s in sections), key=lambda s: (s["firstOrder"], s["id"]))
        count = len(objects(dataset, owner, iri(CD, "hasDerivationStep")))
        order = 1
        previous = compact(one(dataset, owner, iri(CD, "inputFormula")))
        for section in payloads:
            if section["firstOrder"] != order or section["steps"][0]["from"]["id"] != previous:
                raise ValueError("Detail sections must uniquely and continuously cover the derivation")
            order = section["lastOrder"] + 1
            previous = section["steps"][-1]["to"]["id"]
        result = compact(one(dataset, owner, iri(CD, "resultFormula")))
        if not payloads or order != count + 1 or previous != result:
            raise ValueError("Incomplete detail derivation coverage")
        output.append({"id": compact(owner), "label": selected_label_reference(dataset, owner, language)[0],
                       "stepCount": count, "inputFormulaId": compact(one(dataset, owner, iri(CD, "inputFormula"))),
                       "resultFormulaId": result, "sections": payloads,
                       "source": [source_reference(dataset, resource, "cd:hasDerivationDetail"), source_reference(dataset, owner, "cd:hasDerivationStep")]})
    return output


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
        selected_blocks: list[tuple[URIRef, dict[str, Any]]] = []
        for item in items:
            position = integer(dataset, item, iri(CD, "position"))
            selected = one(dataset, item, iri(CD, "selectsResource"))
            role = local_name(one(dataset, item, iri(CD, "communicativeRole")))
            relation_path = literal(dataset, item, iri(CD, "selectionPath"))
            language = literal(dataset, item, iri(CD, "language"))
            block_id = f"{compact(item)}--block"
            selected_is_math_expression = is_resource_type(dataset, selected, "MathExpression")
            selected_is_attribution = is_resource_type(dataset, selected, "Attribution")
            selected_is_diagram = is_diagram_resource(dataset, selected)
            selected_is_chart_definition = is_resource_type(dataset, selected, "ChartDefinition")
            selected_is_definition_list = is_resource_type(dataset, selected, "DefinitionList")
            selected_is_table_definition = is_resource_type(dataset, selected, "TableDefinition")
            selected_is_media_asset = is_resource_type(dataset, selected, "MediaAsset")
            if selected_is_definition_list and role != "DefinitionListRole":
                raise ValueError(f"DefinitionList {compact(selected)} requires DefinitionListRole in {compact(item)}")
            if selected_is_table_definition and role != "TableRole":
                raise ValueError(f"TableDefinition {compact(selected)} requires TableRole in {compact(item)}")
            if selected_is_attribution and role != "AttributionRole":
                raise ValueError(f"Attribution {compact(selected)} requires AttributionRole in {compact(item)}")
            if selected_is_diagram and role != "DiagramRole":
                raise ValueError(f"Diagram {compact(selected)} requires DiagramRole in {compact(item)}")
            if selected_is_chart_definition and role != "ChartRole":
                raise ValueError(f"ChartDefinition {compact(selected)} requires ChartRole in {compact(item)}")
            if selected_is_media_asset and role != "MediaRole":
                raise ValueError(f"MediaAsset {compact(selected)} requires MediaRole in {compact(item)}")
            if role == "DerivationRole":
                if relation_path != "cd:partOfDerivation":
                    raise ValueError("DerivationRole requires cd:partOfDerivation")
                derivation = mathematical_derivation_payload(dataset, selected, language or "en")
                block = {"id": block_id, "kind": "math", "source": derivation["source"],
                         "expression": derivation["steps"][0]["from"]["expression"], "spokenText": derivation["label"],
                         "derivation": derivation, "disclosure": {"order": position - 1, "mode": "initial"},
                         "emphasis": "primary", "intent": {"kind": "derive"}}
                document_version = promote_document_version(document_version, "1.7")
            elif role == "FormulaRole":
                if relation_path != "cd:latex":
                    raise ValueError(f"FormulaRole requires direct cd:latex selection in {compact(item)}")
                if not selected_is_math_expression:
                    raise ValueError(f"FormulaRole requires MathExpression in {compact(item)}")
                expression = literal(dataset, selected, iri(CD, "latex"))
                if expression is None:
                    raise ValueError(f"Missing cd:latex for {compact(selected)}")
                focus_label = resource_text(dataset, focus, language or "de")
                authored_spoken_text = literal(dataset, selected, iri(CD, "body"), language)
                block = {
                    "id": block_id, "kind": "math",
                    "source": [source_reference(dataset, selected, relation_path),
                               *([source_reference(dataset, selected, "cd:body")] if authored_spoken_text else [])],
                    "expression": expression,
                    "spokenText": authored_spoken_text or f"Mathematische Formel für {focus_label}",
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
                # A narrative heading may select authored prose independently of
                # the scientific focus. Do not invent Concepts just for titles.
                narrative_heading = (
                    is_resource_type(dataset, selected, "Interpretation")
                    and boolean_literal(dataset, selected, iri(CD, "authoredResource"))
                )
                title_heading = selected == one(dataset, scene_id, iri(CD, "presentationTitleOf"), required=False)
                if (selected != focus and not narrative_heading and not title_heading) or heading_language is None:
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
            elif role == "DefinitionListRole":
                if relation_path != "cd:hasDefinitionListEntry":
                    raise ValueError(f"DefinitionListRole requires direct cd:hasDefinitionListEntry selection in {compact(item)}")
                if not selected_is_definition_list:
                    raise ValueError(f"DefinitionListRole requires DefinitionList in {compact(item)}")
                entries = definition_list_sequence(dataset, selected, language)
                block = {
                    "id": block_id,
                    "kind": "definition-list",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "entries": [
                        {
                            "id": f"{compact(entry)}--definition-entry",
                            "term": term,
                            **({"description": description} if description is not None else {}),
                            **({"visualMotif": visual_motif} if visual_motif is not None else {}),
                            **({"visualMotifRole": visual_motif_role} if visual_motif_role is not None else {}),
                            "source": [
                                source_reference(dataset, entry, term_path),
                                *([source_reference(dataset, entry, "cd:body")] if description is not None else []),
                                *([source_reference(dataset, entry, "cd:visualMotif")] if visual_motif is not None else []),
                                *([source_reference(dataset, entry, "cd:visualMotifRole")] if visual_motif_role is not None else []),
                            ],
                        }
                        for entry, _entry_position, term, term_path, description, visual_motif, visual_motif_role in entries
                    ],
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary",
                    "intent": {"kind": "explain"},
                }
                document_version = promote_document_version(document_version, "1.4")
            elif role == "TableRole":
                if relation_path != "cd:hasTableRow":
                    raise ValueError(f"TableRole requires direct cd:hasTableRow selection in {compact(item)}")
                if not selected_is_table_definition:
                    raise ValueError(f"TableRole requires TableDefinition in {compact(item)}")
                payload, caption_relation_path = table_payload(dataset, selected, language)
                block_sources = [source_reference(dataset, selected, relation_path)]
                if caption_relation_path is not None and caption_relation_path != relation_path:
                    block_sources.append(source_reference(dataset, selected, caption_relation_path))
                if literal(dataset, selected, iri(CD, "body"), language) is not None:
                    block_sources.append(source_reference(dataset, selected, "cd:body"))
                block = {
                    "id": block_id,
                    "kind": "table",
                    "source": block_sources,
                    **payload,
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary",
                    "intent": {"kind": "explain"},
                }
                document_version = promote_document_version(document_version, "1.5")
            elif role == "MediaRole":
                if relation_path != "cd:uri":
                    raise ValueError(f"MediaRole requires direct cd:uri selection in {compact(item)}")
                if not selected_is_media_asset:
                    raise ValueError(f"MediaRole requires MediaAsset in {compact(item)}")
                payload = media_asset_payload(dataset, selected, language)
                block = {
                    "id": block_id, "kind": "media-reference",
                    "source": [
                        source_reference(dataset, selected, "cd:uri"),
                        source_reference(dataset, selected, "cd:mediaType"),
                        source_reference(dataset, selected, "cd:alternativeText"),
                    ],
                    **payload,
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "supporting", "intent": {"kind": "explain"},
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
                if payload["chartType"] in ("histogram","histogram2d"):
                    predicates=("cd:chartType","cd:usesDataset","cd:binEdges","cd:xAxisUnit")+(("cd:yBinEdges","cd:yAxisUnit") if payload["chartType"]=="histogram2d" else ("cd:histogramNormalization",))
                    block_sources.extend(source_reference(dataset,selected,p) for p in predicates)
                if payload["chartType"] == "box":
                    block_sources.extend(source_reference(dataset, selected, p) for p in ("cd:chartType", "cd:dependsOn", "cd:fenceMultiplier", "cd:yAxisUnit", "cd:hasChartGroup"))
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
                document_version = promote_document_version(document_version, "1.10" if payload["chartType"] in ("histogram","histogram2d") else "1.9" if payload["chartType"] == "box" else "1.8" if payload["chartType"] == "observations" else "1.6" if payload["chartType"] == "dot" else "1.2")
                if payload.get("binAdjustment") or "compact" in payload or (payload["chartType"]=="observations" and payload["view"]=="ecdf" and len(payload["series"])>1) or any(g.get("interval") for g in payload.get("groups",[])):
                    document_version=promote_document_version(document_version,"1.11")
                if payload.get("view")=="moments":document_version=promote_document_version(document_version,"1.12")
                if payload["chartType"] == "timeline":
                    document_version = promote_document_version(document_version, "1.13")
                    block_sources.extend(source_reference(dataset, selected, p) for p in ("cd:usesDataset", "cd:hasTimelineCategory", "cd:hasTimelineRun"))
                    if objects(dataset, selected, DCTERMS.hasPart):
                        block_sources.append(source_reference(dataset, selected, "dct:hasPart"))
            elif role == "DiagramRole":
                if relation_path != "cd:body":
                    raise ValueError(f"DiagramRole requires direct cd:body selection in {compact(item)}")
                if not selected_is_diagram:
                    raise ValueError(
                        f"DiagramRole requires FlowDiagram, NetworkDiagram, or SequenceDiagram in {compact(item)}"
                    )
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
                document_version = promote_document_version(
                    document_version,
                    "1.3" if is_resource_type(dataset, selected, "SequenceDiagram") else "1.2",
                )
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
                    expected_result = one(dataset, selected, iri(CD, "hasExpectedResult"), required=False)
                    block = {
                        "id": block_id, "kind": "prompt",
                        "source": [source_reference(dataset, selected, relation_path)],
                        "prompt": text,
                        "responseMode": "free-text",
                        "fallback": text,
                        "disclosure": {"order": position - 1, "mode": "initial"},
                        "emphasis": "primary", "intent": {"kind": "practice"},
                    }
                    if isinstance(expected_result, URIRef):
                        block["expectedResult"] = selected_literal(
                            dataset, expected_result, iri(CD, "body"), "cd:body", language,
                        )
                        block["source"].append(source_reference(dataset, expected_result, "cd:body"))
                else:
                    body_format=literal(dataset,selected,iri(CD,"bodyFormat")) or "plain"
                    if body_format not in ("plain","markdown"):raise ValueError("Unsupported authored body format")
                    block = {
                        "id": block_id, "kind": "prose",
                        "source": [source_reference(dataset, selected, relation_path)],
                        "text": text, "format": body_format,
                        "disclosure": {"order": position - 1, "mode": "initial"},
                        "emphasis": "primary", "intent": {"kind": "explain"},
                    }
                    if body_format!="plain":block["source"].append(source_reference(dataset,selected,"cd:bodyFormat"))
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
                option_resources = sorted(
                    [value for value in objects(dataset, selected, iri(CD, "hasPollOption")) if isinstance(value, URIRef)],
                    key=str,
                )
                if len(option_resources) < 2:
                    raise ValueError(f"Audience poll {compact(selected)} requires at least two options")
                options = [resource_text(dataset, option, language or "de") for option in option_resources]
                option_ids = [compact(option) for option in option_resources]
                correct_option = one(dataset, selected, iri(CD, "correctPollOption"), required=False)
                if correct_option is not None and (
                    not isinstance(correct_option, URIRef) or correct_option not in option_resources
                ):
                    raise ValueError(f"Audience poll {compact(selected)} has an invalid correct option")
                expected_result = one(dataset, selected, iri(CD, "hasExpectedResult"), required=False)
                if expected_result is not None and not isinstance(expected_result, URIRef):
                    raise ValueError(f"Audience poll {compact(selected)} has an invalid expected result")
                sources = [source_reference(dataset, selected, relation_path)] + [
                    source_reference(dataset, option, "cd:hasPollOption") for option in option_resources
                ]
                if isinstance(expected_result, URIRef):
                    sources.append(source_reference(dataset, expected_result, "cd:hasExpectedResult"))
                block = {
                    "id": block_id, "kind": "prompt",
                    "source": sources,
                    "prompt": prompt,
                    "responseMode": "single-choice",
                    "options": options,
                    "optionIds": option_ids,
                    **({"correctOptionId": compact(correct_option)} if isinstance(correct_option, URIRef) else {}),
                    **({
                        "expectedResult": resource_text(dataset, expected_result, language or "de")
                    } if isinstance(expected_result, URIRef) else {}),
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
            if block["kind"] == "prompt" and role == "ExerciseRole":
                media_parts = sorted((part for part in objects(dataset, selected, DCTERMS.hasPart)
                                      if isinstance(part, URIRef) and is_resource_type(dataset, part, "MediaAsset")), key=str)
                if media_parts:
                    children = [{**block, "disclosure": {"order": 0, "mode": "initial"}}]
                    for media_index, media in enumerate(media_parts, 1):
                        children.append({
                            "id": f"{block_id}--{compact(media)}", "kind": "media-reference",
                            "uri": selected_literal(dataset, media, iri(CD, "uri"), "cd:uri", None),
                            "mediaType": selected_literal(dataset, media, iri(CD, "mediaType"), "cd:mediaType", None),
                            "alternativeText": selected_literal(dataset, media, iri(CD, "alternativeText"), "cd:alternativeText", language),
                            "source": [source_reference(dataset, selected, "dct:hasPart"),
                                       source_reference(dataset, media, "cd:uri"),
                                       source_reference(dataset, media, "cd:alternativeText")],
                            "disclosure": {"order": media_index, "mode": "initial"},
                            "emphasis": "supporting", "intent": {"kind": "explain"},
                        })
                    block = {
                        "id": f"{block_id}--illustrated", "kind": "group", "children": children,
                        "readingOrder": [child["id"] for child in children],
                        "source": [source_reference(dataset, selected, relation_path), source_reference(dataset, selected, "dct:hasPart")],
                        "disclosure": block["disclosure"], "emphasis": "primary", "intent": {"kind": "practice"},
                    }
            if block["kind"] == "math" and is_resource_type(dataset, selected, "MathExpression"):
                formula_label = deterministic_authored_literal(dataset, selected, iri(CD, "formulaLabel"), language)
                if formula_label:
                    block["label"] = formula_label
                    block["source"].append(source_reference(dataset, selected, "cd:formulaLabel"))
            if block["kind"] == "math":
                details = mathematical_derivation_details(dataset, selected, language or "en")
                if details:
                    block["derivationDetails"] = details
                    block["source"].append(source_reference(dataset, selected, "cd:hasDerivationDetail"))
                    document_version = promote_document_version(document_version, "1.7")
            blocks.append(block)
            # A selected formula retains its explicitly authored definition parts.
            # This is semantic expansion, not a renderer-generated symbol glossary.
            if block["kind"] == "math":
                legends = sorted((part for part in objects(dataset, selected, DCTERMS.hasPart)
                                  if isinstance(part, URIRef) and is_resource_type(dataset, part, "DefinitionList")), key=str)
                for legend in legends:
                    entries = definition_list_sequence(dataset, legend, language)
                    blocks.append({
                        "id": f'{block_id}--{compact(legend)}', "kind": "definition-list",
                        "source": [source_reference(dataset, selected, "dct:hasPart"),
                                   source_reference(dataset, legend, "cd:hasDefinitionListEntry")],
                        "entries": [{
                            "id": f"{compact(entry)}--definition-entry", "term": term,
                            **({"description": description} if description is not None else {}),
                            **({"visualMotif": motif} if motif is not None else {}),
                            **({"visualMotifRole": motif_role} if motif_role is not None else {}),
                            "source": [source_reference(dataset, entry, term_path),
                                       *([source_reference(dataset, entry, "cd:body")] if description is not None else []),
                                       *([source_reference(dataset, entry, "cd:visualMotif")] if motif is not None else []),
                                       *([source_reference(dataset, entry, "cd:visualMotifRole")] if motif_role is not None else [])],
                        } for entry, _, term, term_path, description, motif, motif_role in entries],
                        "emphasis": "supporting", "intent": {"kind": "explain"},
                    })
                    symbols = set(objects(dataset, selected, iri(CD, "hasSymbol")))
                    referenced_symbols = {symbol for entry, *_ in entries for symbol in objects(dataset, entry, DCTERMS.references)
                                          if is_resource_type(dataset, symbol, "MathSymbol")}
                    symbols.update(referenced_symbols)
                    structured = mathematical_symbol_entries(dataset, symbols, language or "en")
                    # Explicit symbol-reference legends opt into normalization.
                    # Legacy authored parts can contain scope, units or worked-
                    # example explanations: adding hasSymbol must not erase them.
                    if structured and referenced_symbols:
                        blocks[-1]["entries"] = structured
                    document_version = promote_document_version(document_version, "1.4")
            if block["kind"] == "code":
                # Code glossaries are authored RDF parts, never generated by parsing R.
                legends = sorted((part for part in objects(dataset, selected, DCTERMS.hasPart)
                                  if isinstance(part, URIRef) and is_resource_type(dataset, part, "DefinitionList")), key=str)
                for legend in legends:
                    entries = definition_list_sequence(dataset, legend, language)
                    blocks.append({
                        "id": f'{block_id}--{compact(legend)}', "kind": "definition-list",
                        "source": [source_reference(dataset, selected, "dct:hasPart"),
                                   source_reference(dataset, legend, "cd:hasDefinitionListEntry")],
                        "entries": [{
                            "id": f"{compact(entry)}--definition-entry", "term": term,
                            **({"description": description} if description is not None else {}),
                            **({"visualMotif": motif} if motif is not None else {}),
                            **({"visualMotifRole": motif_role} if motif_role is not None else {}),
                            "source": [source_reference(dataset, entry, term_path),
                                       *([source_reference(dataset, entry, "cd:body")] if description is not None else []),
                                       *([source_reference(dataset, entry, "cd:visualMotif")] if motif is not None else []),
                                       *([source_reference(dataset, entry, "cd:visualMotifRole")] if motif_role is not None else [])],
                        } for entry, _, term, term_path, description, motif, motif_role in entries],
                        "emphasis": "supporting", "intent": {"kind": "explain"},
                    })
                    document_version = promote_document_version(document_version, "1.4")
            if isinstance(selected, URIRef):
                selected_blocks.append((selected, block))

        blocks_by_resource: dict[URIRef, list[dict[str, Any]]] = {}
        for resource, block in selected_blocks:
            blocks_by_resource.setdefault(resource, []).append(block)

        for resource, chart_block in selected_blocks:
            if not is_resource_type(dataset, resource, "ChartDefinition"):
                continue
            if one(dataset, resource, iri(CD, "chartType")) != iri(CD, "BarChart"):
                continue

            derived_resources = [
                target
                for target in objects(dataset, resource, iri(CD, "derivedFromResource"))
                if isinstance(target, URIRef)
            ]
            for derived_resource in derived_resources:
                for evidence_block in blocks_by_resource.get(derived_resource, []):
                    evidence_block["disclosure"] = {
                        "order": evidence_block["disclosure"]["order"],
                        "mode": "progressive",
                        "step": 1,
                        "triggerResourceId": compact(resource),
                    }

            chart_annotations = {
                annotation
                for annotation in objects(dataset, resource, iri(CD, "hasChartAnnotation"))
                if isinstance(annotation, URIRef)
            }
            if not chart_annotations:
                continue

            for interpretation_resource, interpretation_block in selected_blocks:
                if not is_resource_type(dataset, interpretation_resource, "Interpretation"):
                    continue
                interpreted_resources = {
                    target
                    for target in objects(dataset, interpretation_resource, iri(CD, "interpretsResource"))
                    if isinstance(target, URIRef)
                }
                matching_annotations = sorted(chart_annotations & interpreted_resources, key=str)
                if not matching_annotations:
                    continue
                interpretation_block["disclosure"] = {
                    "order": interpretation_block["disclosure"]["order"],
                    "mode": "progressive",
                    "step": 3,
                    "triggerResourceId": compact(matching_annotations[0]),
                }

        scene_compact = compact(scene_id)
        first_block = blocks[0]
        accessibility_label = (
            first_block.get("text")
            or first_block.get("label")
            or first_block.get("spokenText")
            or first_block.get("prompt")
            or first_block["id"]
        )
        title_work = one(dataset, scene_id, iri(CD, "presentationTitleOf"), required=False)
        from presentation_metadata import project_title
        scenes.append({
            "id": f"{scene_compact}--scene",
            "source": [source_reference(dataset, scene_id), source_reference(dataset, focus)],
            "blocks": blocks,
            "readingOrder": [block["id"] for block in blocks],
            **({"presentationTitle": project_title(dataset, title_work)} if title_work else {}),
            "accessibility": {"label": accessibility_label},
            **({"narration": literal(dataset, scene_id, iri(CD, "narration"), language or "en"),
                "source": [source_reference(dataset, scene_id), source_reference(dataset, focus), source_reference(dataset, scene_id, "cd:narration")]}
               if literal(dataset, scene_id, iri(CD, "narration"), language or "en") else {}),
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
    # The same triple can legitimately occur in multiple named graphs. Retain
    # each attributed record, but never let quad iteration order break that tie.
    statements.sort(key=lambda item: (
        item["sourceEntityId"], item["predicateId"], item["targetEntityId"],
        tuple(item["source"][0]["provenanceIds"]),
    ))
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


def scene_document_binding(
    path: CoursePathReference,
    document: dict[str, Any],
) -> dict[str, str]:
    return {
        "pathId": path.path_id,
        "pathGraphId": path.path_graph_id,
        "sceneDocumentId": document["id"],
    }


def path_is_fully_scene_bound(dataset: Dataset, path: CoursePathReference) -> bool:
    path_resource = URIRef(path.path_id)
    path_graph = dataset.graph(URIRef(path.path_graph_id))
    steps = sorted(
        set(path_graph.objects(path_resource, iri(CD, "hasStep"))),
        key=lambda step: (integer(dataset, step, iri(CD, "position")), str(step)),
    )
    if not steps:
        raise ValueError(f"LearningPath {compact(path_resource)} has no PathSteps")

    scene_counts = [
        len(set(path_graph.objects(step, iri(CD, "usesScene"))))
        for step in steps
    ]
    if all(count == 0 for count in scene_counts):
        return False
    if not all(count == 1 for count in scene_counts):
        raise ValueError(
            f"LearningPath {compact(path_resource)} has partial or multiple scene bindings"
        )
    return True


def build_offering_artifact(
    offering_id: str,
    *,
    snapshot_language: str,
) -> dict[str, Any]:
    dataset = assemble_dataset()
    fingerprint = dataset_fingerprint(dataset)
    fingerprint_identity = f"sha256:{fingerprint}"
    offering_document = project_teaching_offering_runtime_document(
        dataset,
        offering_id,
        fingerprint_identity,
    )

    units_by_id = {
        unit["id"]: unit
        for unit in offering_document["units"]
    }
    references: list[CoursePathReference] = []
    seen: set[CoursePathReference] = set()
    for placement in offering_document["placements"]:
        unit = units_by_id[placement["unitId"]]
        for path_record in unit["paths"]:
            reference = CoursePathReference(path_record["id"], path_record["graphId"])
            if reference in seen:
                continue
            seen.add(reference)
            references.append(reference)

    scene_documents: list[dict[str, Any]] = []
    bindings: list[dict[str, str]] = []
    for reference in references:
        if not path_is_fully_scene_bound(dataset, reference):
            continue
        document = compile_scene_document(dataset, reference)
        scene_documents.append(document)
        bindings.append(scene_document_binding(reference, document))

    bindings.sort(key=lambda item: (item["pathId"], item["pathGraphId"]))
    return {
        "artifactVersion": "1.0",
        "datasetFingerprint": fingerprint_identity,
        "datasetSnapshot": dataset_snapshot(dataset, fingerprint, snapshot_language),
        "teachingOfferingDocuments": [offering_document],
        "sceneDocuments": scene_documents,
        "sceneDocumentBindings": bindings,
    }


def build_artifact(
    selection_request: CourseUnitPathSelectionRequest | None = None,
) -> dict[str, Any]:
    request = selection_request or default_selection_request()
    dataset = assemble_dataset()
    selection = select_course_unit_path(dataset, request)
    language = effective_path_language(dataset, selection.path)
    fingerprint = dataset_fingerprint(dataset)
    fingerprint_identity = f"sha256:{fingerprint}"
    document = compile_scene_document(dataset, selection.path)
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
        "sceneDocuments": [document],
        "sceneDocumentBindings": [scene_document_binding(selection.path, document)],
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


def teaching_text_fallback(text: str) -> str:
    """Same inert paragraph/strong/list subset used by the live text primitive."""
    def inline(value: str) -> str:
        return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", html.escape(value))
    parts = []
    for paragraph in re.split(r"\r?\n\s*\r?\n", text):
        lines = paragraph.splitlines()
        if lines and all(re.match(r"^-\s+", line) for line in lines):
            items = []
            for line in lines:
                match = re.match(r"^-\s+\[([?!])\]\s+([\s\S]*)$", line)
                purpose = "question" if match and match.group(1) == "?" else "task" if match else "neutral"
                content = match.group(2) if match else re.sub(r"^-\s+", "", line)
                items.append(f'<li data-marker-purpose="{purpose}"><span class="teaching-point-marker" aria-hidden="true"></span>{inline(content)}</li>')
            parts.append('<ul class="teaching-points">' + ''.join(items) + '</ul>')
        else:
            parts.append('<p>' + inline(paragraph).replace('\n', '<br>') + '</p>')
    return ''.join(parts)


def media_fallback_markup(block: dict[str, Any]) -> str:
    """Render direct or enriched media with the same escaped accessible fallback."""
    uri = html.escape(block["uri"], quote=True)
    alternative = html.escape(block["alternativeText"], quote=True)
    media_type = block.get("mediaType")
    if isinstance(media_type, str) and media_type.startswith("video/"):
        content = f'<video src="{uri}" controls preload="metadata" playsinline aria-label="{alternative}"></video>'
    elif media_type is None or media_type.startswith("image/"):
        content = f'<img src="{uri}" alt="{alternative}" />'
    else:
        content = f'<span>{html.escape(block["alternativeText"])}</span>'
    type_attribute = f' data-media-type="{html.escape(media_type, quote=True)}"' if media_type else ""
    return (
        f'<figure class="media-reference-fallback" data-media-block-id="{html.escape(block["id"], quote=True)}"'
        f'{type_attribute}{fallback_attributes(block["source"])}>{content}</figure>'
    )


def definition_list_fallback_markup(block: dict[str, Any], *, scrollable: bool = False) -> str:
    entries = "".join(
        f'<div data-definition-entry-id="{html.escape(entry["id"], quote=True)}"{fallback_attributes(entry["source"])}>'
        f'<dt>{html.escape(entry["term"])}</dt>'
        + (f'<dd>{html.escape(entry["description"])}</dd>' if entry.get("description") else "")
        + "</div>"
        for entry in block["entries"]
    )
    scroll_attributes = ' tabindex="0" aria-label="Scrollable authored function glossary"' if scrollable else ""
    return f'<dl class="definition-list-fallback"{scroll_attributes}{fallback_attributes(block["source"])}>{entries}</dl>'


def derivation_fallback_markup(section: dict[str, Any]) -> str:
    content = [f'<code>{html.escape(section["steps"][0]["from"]["expression"])}</code>']
    for step in section["steps"]:
        content.append(f'<h3>{html.escape(step["operation"])}</h3><code>{html.escape(step["rule"]["formula"]["expression"])}</code><code>{html.escape(step["to"]["expression"])}</code>')
        content.append(f'<details><summary>{html.escape(step["rule"]["label"])}</summary><p>{html.escape(step["rule"]["description"])}</p><code>{html.escape(step["explanation"]["application"]["expression"])}</code><p>{html.escape(step["explanation"]["text"])}</p></details>')
        content.extend(f'<p>{html.escape(a["description"])}</p>' for a in step["assumptions"])
    content.append('<dl>' + ''.join(f'<dt>{html.escape(e["term"])}</dt><dd>{html.escape(e.get("description", ""))}</dd>' for e in section["legend"]) + '</dl>')
    return '<section class="derivation-fallback">' + ''.join(content) + '</section>'


def static_fallback(artifact: dict[str, Any], *, _fragment: bool = False) -> str:
    document = artifact["sceneDocuments"][0]
    articles = []
    for scene in document["scenes"]:
        if scene.get("presentationTitle") and not _fragment:
            from presentation_metadata import title_fallback
            articles.append(f'<article id="{html.escape(scene["id"], quote=True)}">' + title_fallback(scene["presentationTitle"]) + '</article>')
            continue
        blocks = []
        consumed_function_legend_ids: set[str] = set()
        for block in scene["blocks"]:
            if block["id"] in consumed_function_legend_ids:
                continue
            if block["kind"] == "group":
                by_id = {child["id"]: child for child in block["children"]}
                children = [by_id[child_id] for child_id in block["readingOrder"]]
                content = static_fallback({"sceneDocuments": [{**document, "scenes": [{**scene, "blocks": children}]}]}, _fragment=True)
                blocks.append(f'<section class="group-fallback" role="group"{fallback_attributes(block["source"])}>{content}</section>')
                continue
            if block["kind"] == "media-reference":
                blocks.append(media_fallback_markup(block))
                continue
            if block["kind"] == "math":
                if block.get("derivation"):
                    blocks.append(derivation_fallback_markup(block["derivation"]))
                else:
                    blocks.append(
                    f'<div class="math-fallback" role="math" aria-label="{html.escape(block["spokenText"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<code>{html.escape(block["expression"])}</code>'
                    f'</div>'
                    )
                for detail in block.get("derivationDetails", []):
                    blocks.append(f'<details class="derivation-detail-fallback"><summary>{html.escape(detail["label"])}</summary>' + ''.join(derivation_fallback_markup(s) for s in detail['sections']) + '</details>')
                continue
            if block["kind"] == "code":
                code_markup = (
                    f'<div class="code-fallback" data-code-block-id="{html.escape(block["id"], quote=True)}" '
                    f'data-language="{html.escape(block["language"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<pre><code>{html.escape(block["fallback"])}</code></pre>'
                    f'</div>'
                )
                next_index = scene["blocks"].index(block) + 1
                legend = scene["blocks"][next_index] if next_index < len(scene["blocks"]) else None
                is_function_legend = legend and legend["kind"] == "definition-list" and legend.get("emphasis") == "supporting" \
                    and any(source.get("relationPath") == "dct:hasPart" and source.get("resourceId") == block["source"][0].get("resourceId") for source in legend["source"])
                if is_function_legend:
                    consumed_function_legend_ids.add(legend["id"])
                    blocks.append(f'<section class="code-function-workbench-fallback" role="group" aria-label="Code and function glossary">{code_markup}{definition_list_fallback_markup(legend, scrollable=True)}</section>')
                else:
                    blocks.append(code_markup)
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
            if block["kind"] == "definition-list":
                blocks.append(definition_list_fallback_markup(block))
                continue
            if block["kind"] == "table":
                headers = "".join(
                    f'<th scope="col" data-table-column-id="{html.escape(column["id"], quote=True)}"{fallback_attributes(column["source"])}>'
                    f'{html.escape(column["label"])}</th>'
                    for column in block["columns"]
                )
                rows = "".join(
                    f'<tr data-table-row-id="{html.escape(row["id"], quote=True)}"{fallback_attributes(row["source"])}>'
                    + "".join(
                        f'<td data-table-cell-id="{html.escape(cell["id"], quote=True)}"{fallback_attributes(cell["source"])}>'
                        f'{html.escape(cell["text"])}</td>'
                        for cell in row["cells"]
                    )
                    + '</tr>'
                    for row in block["rows"]
                )
                description = (
                    f' <span>{html.escape(block["description"])}</span>'
                    if block.get("description")
                    else ""
                )
                blocks.append(
                    f'<figure class="table-fallback"{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["caption"])}</strong>{description}</figcaption>'
                    f'<table><thead><tr>{headers}</tr></thead><tbody>{rows}</tbody></table>'
                    f'</figure>'
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
                    annotation_items = "".join(
                        f'<li data-chart-annotation-id="{html.escape(annotation["id"], quote=True)}">'
                        f'{html.escape(annotation["label"])}</li>'
                        for annotation in block.get("annotations", [])
                    )
                    body = (
                        f'<ol class="chart-data">{value_items}</ol>'
                        f'<ul class="chart-annotations">{annotation_items}</ul>'
                    )
                elif block["chartType"] == "observations":
                    rows = "".join(f'<li{fallback_attributes(datum["source"])}>{html.escape(series["label"])}: {html.escape(datum["label"])}: {datum["value"]} {html.escape(block["xAxis"]["unit"])}</li>' for series in block["series"] for datum in series["data"])
                    extra = ""
                    if block["view"]=="moments":
                        for series in block["series"]:
                            values=[d["value"] for d in series["data"]];n=len(values);mean=sum(values)/n
                            m2,m3,m4=[sum((v-mean)**r for v in values)/n for r in (2,3,4)]
                            skew=m3/m2**1.5 if m2>0 else "undefined";kurt=m4/m2**2 if m2>0 else "undefined"
                            extra+=f'<p>{html.escape(series["label"])}: mean={mean}; m2={m2}; sample variance={m2*n/(n-1)}; skewness={skew}; kurtosis={kurt}. Point, linearly interpolated boxplot and common-bin histogram views retain all {n} observations.</p>'
                    if "threshold" in block:
                        initial = block["threshold"]["initial"]
                        for series in block["series"]:
                            values=sorted(d["value"] for d in series["data"]);count=sum(v<=initial for v in values)
                            extra+=f'<p>{html.escape(series["label"])}: At x = {initial}: {count}/{len(values)} = {count/len(values)}. All ties enter together.</p><ul>'
                            extra+="".join(f'<li>x = {v}: left limit {sum(x < v for x in values)/len(values)}; F_n(x) = {sum(x <= v for x in values)/len(values)}</li>' for v in sorted(set(values)))+'</ul><p>Below the minimum: 0; at and above the maximum: 1.</p>'
                    elif block["view"] == "order":
                        extra = '<p>Ordered observations (ties retained): ' + ", ".join(f'{d["label"]}={d["value"]}' for d in sorted(block["series"][0]["data"], key=lambda d: d["value"])) + '</p>'
                    formal = block.get("formal")
                    if "comparison" in block:
                        extra += "".join(f'<p{fallback_attributes(r["source"])}>{html.escape(r["label"])}</p>' for s in block["series"] for r in s["summaries"].values())
                        extra += "".join(f'<p{fallback_attributes(s["source"])}>{html.escape(s["label"])}: {html.escape(s["prompt"])}</p>' + ''.join(f'<p{fallback_attributes(t["source"])}>{html.escape(t["text"])}</p>' for t in s.get("topics", [])) + ''.join(f'<p{fallback_attributes(p["source"])}>Optional: {html.escape(p["label"])}: {html.escape(p["prompt"])}</p>' for p in s.get("investigations", [])) for s in block["comparison"]["stages"])
                        extra += '<details><summary>Scientific details</summary>' + "".join('<p>' + html.escape(d.get("text", d.get("expression", ""))) + '</p>' for d in block["comparison"]["details"]) + '</details>'
                    if formal:
                        extra += f'<details><summary>Definition and formula</summary><p>{html.escape(formal["definition"])}</p><pre>{html.escape(formal["expression"])}</pre></details>'
                    body = f'<ol>{rows}</ol>{extra}'
                elif block["chartType"] in ("histogram","histogram2d"):
                    records=histogram_cells(block["data"],block["edges"],block["yEdges"]) if block["chartType"]=="histogram2d" else histogram_bins([d["value"] for d in block["data"]],block["edges"],block["normalization"])
                    body='<p>Bins are [lower, upper), with the final upper edge included. n='+str(len(block["data"]))+'</p><pre>'+html.escape(json.dumps(records,ensure_ascii=False,indent=2))+'</pre>'
                elif block["chartType"] in ("dot", "box"):
                    unit = html.escape(block["yAxis"].get("unit", ""))
                    rows = "".join(
                        f'<li{fallback_attributes(datum["source"])}>{html.escape(group["label"])}: {datum["value"]} {unit}</li>'
                        for group in block["groups"] for datum in group["data"]
                    )
                    reference = block.get("referenceLine")
                    annotation = (f'<p{fallback_attributes(reference["source"])}>{html.escape(reference["label"])}: {reference["value"]} {unit}</p>' if reference else "")
                    summaries = "".join(
                        f'<li{fallback_attributes(group["summary"]["source"])}>{html.escape(group["label"])}; '
                        f'{html.escape(group["summary"]["label"])}: {group["summary"]["value"]} {unit}</li>'
                        for group in block["groups"] if "summary" in group
                    )
                    curves = "".join(
                        f'<li{fallback_attributes(datum["source"])}>{html.escape(curve["label"])}: x={datum["x"]}, y={datum["y"]} {unit}</li>'
                        for curve in block.get("curves", []) for datum in curve["data"]
                    )
                    body = f'<ol class="chart-data">{rows}{summaries}{curves}</ol>{annotation}'
                    for group in block["groups"]:
                        if "interval" in group:
                            interval=group["interval"];count=sum(interval["lower"]<=d["value"]<=interval["upper"] for d in group["data"])
                            body+=f'<p{fallback_attributes(interval["source"])}>{html.escape(interval["label"])}: [{interval["lower"]}, {interval["upper"]}] {unit}; {count}/{len(group["data"])} = {100*count/len(group["data"])}% in the closed interval.</p>'
                    if block["chartType"] == "box":
                        import statistics
                        body += '<p>Linear interpolation; whiskers end at observations inside the fences, not at the fences.</p>'
                        for group in block["groups"]:
                            values = sorted(d["value"] for d in group["data"])
                            q1, median, q3 = ([values[0]] * 3 if len(values) == 1 else statistics.quantiles(values, n=4, method="inclusive"))
                            iqr = q3-q1
                            lower, upper = q1-block["fenceMultiplier"]*iqr, q3+block["fenceMultiplier"]*iqr
                            inside = [v for v in values if lower <= v <= upper]
                            outliers = [v for v in values if v < lower or v > upper]
                            body += f'<p>{html.escape(group["label"])}: Q1={q1}; median={median}; Q3={q3}; IQR={iqr}; fences=[{lower}, {upper}]; whiskers=[{min(inside)}, {max(inside)}]; flagged={outliers}</p>'
                elif block["chartType"] == "timeline":
                    body = '<ul class="chart-data">' + ''.join(
                        f'<li{fallback_attributes(interval["source"])}>{html.escape(scenario["label"])}; {html.escape(lane["label"])}; '
                        f'{html.escape(interval["label"])}; {html.escape(next(c["label"] for c in block["categories"] if c["id"] == interval["categoryId"]))}: '
                        f'{interval["start"]}–{interval["end"]} {html.escape(block["xAxis"]["unit"])}</li>'
                        for scenario in block["scenarios"] for lane in scenario["lanes"] for interval in lane["intervals"]
                    ) + '</ul>'
                elif block["chartType"] == "line":
                    point_items = "".join(
                        f'<li data-chart-series-id="{html.escape(series["id"], quote=True)}"{fallback_attributes(series["source"])}>'
                        f'<strong>{html.escape(series["label"])}</strong><ol>'
                        + "".join(f'<li data-chart-datum-id="{html.escape(datum["id"], quote=True)}"{fallback_attributes(datum["source"])}>'
                                  f'x={html.escape(str(datum["x"]))}, y={html.escape(str(datum["y"]))}</li>' for datum in series["data"])
                        + '</ol></li>'
                        for series in block["series"]
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
                if block["diagramType"] == "sequence":
                    role_labels = {role["id"]: role["label"] for role in block["participantRoles"]}
                    message_labels = {message["id"]: message["label"] for message in block["messages"]}
                    participants = "".join(
                        f'<li data-participant-role-id="{html.escape(role["id"], quote=True)}"{fallback_attributes(role["source"])}>{html.escape(role["label"])}</li>'
                        for role in block["participantRoles"]
                    )
                    messages = "".join(
                        f'<li data-interaction-message-id="{html.escape(message["id"], quote=True)}" '
                        f'data-source-role-id="{html.escape(message["sourceRoleId"], quote=True)}" '
                        f'data-target-role-id="{html.escape(message["targetRoleId"], quote=True)}"{fallback_attributes(message["source"])}>'
                        f'{html.escape(role_labels.get(message["sourceRoleId"], message["sourceRoleId"]))}: '
                        f'{html.escape(message["label"])} → '
                        f'{html.escape(role_labels.get(message["targetRoleId"], message["targetRoleId"]))}</li>'
                        for message in block["messages"]
                    )
                    state_fragments = []
                    for state in block.get("states", []):
                        active_message_ids = state.get("activeMessageIds", [])
                        active_messages = (
                            f'<p class="diagram-active-messages">Active messages: '
                            f'{html.escape(", ".join(message_labels.get(message_id, message_id) for message_id in active_message_ids))}</p>'
                            if active_message_ids
                            else ""
                        )
                        bindings = "".join(
                            f'<li data-participant-binding-role-id="{html.escape(binding["roleId"], quote=True)}" '
                            f'data-participant-id="{html.escape(binding["participantId"], quote=True)}"{fallback_attributes(binding["source"])}>'
                            f'{html.escape(role_labels.get(binding["roleId"], binding["roleId"]))}: {html.escape(binding["label"])}</li>'
                            for binding in state.get("participantBindings", [])
                        )
                        bindings_markup = f'<ul class="diagram-participant-bindings">{bindings}</ul>' if bindings else ""
                        active_attribute = (
                            f' data-active-message-ids="{html.escape(" ".join(active_message_ids), quote=True)}"'
                            if active_message_ids
                            else ""
                        )
                        state_fragments.append(
                            f'<section class="diagram-state" data-diagram-state-id="{html.escape(state["id"], quote=True)}"'
                            f'{active_attribute}{fallback_attributes(state["source"])}><strong>{html.escape(state["label"])}</strong>'
                            f'{active_messages}{bindings_markup}</section>'
                        )
                    states = "".join(state_fragments)
                    blocks.append(
                        f'<figure class="diagram-fallback" data-diagram-type="sequence"{fallback_attributes(block["source"])}>'
                        f'<figcaption><strong>{html.escape(block["label"])}</strong> <span>{html.escape(block["description"])}</span></figcaption>'
                        f'<ol class="diagram-participants">{participants}</ol>'
                        f'<ol class="diagram-messages">{messages}</ol>'
                        f'{states}'
                        f'</figure>'
                    )
                    continue
                labels = {node["id"]: node["label"] for node in block["nodes"]}
                nodes = "".join(
                    f'<li data-diagram-node-id="{html.escape(node["id"], quote=True)}"{fallback_attributes(node["source"])}>{html.escape(node["label"])}</li>'
                    for node in block["nodes"]
                )
                edges = "".join(
                    f'<li data-diagram-edge-id="{html.escape(edge["id"], quote=True)}"{fallback_attributes(edge["source"])}>'
                    f'{html.escape(labels.get(edge["sourceNodeId"], edge["sourceNodeId"]))}: '
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
                states = "".join(
                    f'<section class="diagram-state" data-diagram-state-id="{html.escape(state["id"], quote=True)}"{fallback_attributes(state["source"])}>'
                    f'<strong>{html.escape(state["label"])}</strong>'
                    + "".join(
                        f'<p data-shared-edge-annotation-id="{html.escape(annotation["id"], quote=True)}" '
                        f'data-edge-ids="{html.escape(" ".join(annotation["edgeIds"]), quote=True)}"{fallback_attributes(annotation["source"])}>'
                        f'{html.escape(annotation["label"])}</p>'
                        for annotation in state["sharedEdgeAnnotations"]
                    )
                    + '</section>'
                    for state in block.get("states", [])
                )
                blocks.append(
                    f'<figure class="diagram-fallback" data-diagram-type="{html.escape(block["diagramType"], quote=True)}"'
                    f'{focus_attribute}{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["label"])}</strong> <span>{html.escape(block["description"])}</span></figcaption>'
                    f'<ol class="diagram-nodes">{nodes}</ol>'
                    f'<ol class="diagram-edges">{edges}</ol>'
                    f'{states}'
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
                        f'{teaching_text_fallback(block["prompt"])}<ul>{options}</ul>'
                        f'</div>'
                    )
                elif response_mode == "free-text":
                    blocks.append(
                        f'<div class="prompt-fallback"{fallback_attributes(block["source"])}>'
                        f'{teaching_text_fallback(block["prompt"])}'
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
        if _fragment:
            articles.append("".join(blocks))
            continue
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
