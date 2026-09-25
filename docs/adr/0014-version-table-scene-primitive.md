# ADR-0014: Version renderer-neutral tabular-data scene primitives

- Status: Accepted
- Date: 2026-09-22

## Context

Project Chemie Digital already treats prose, lists, definition lists, code, media, diagrams and charts as explicit renderer-neutral SceneDocument primitives. During the CogniFlow presentation standardization audit, tabular scientific information was still encoded as a `CodeExample` with `programmingLanguage "tsv"`. The pitch preview then detected that language token and reconstructed an HTML table by splitting strings on tabs and newlines.

That representation made tabular structure implicit in serialization syntax:

- columns were inferred from the first text line;
- rows and cells had no stable semantic identities;
- individual cells could not retain provenance/source references;
- a renderer had to know that one code language was secretly a different content primitive;
- changing serialization format could change presentation structure.

This violates the semantics-first goal and the renderer-neutral boundary of ADR-0003. It also prevents non-presentation consumers from preserving table structure without reproducing the same parsing heuristic.

## Decision

Introduce `SceneDocument 1.5` as the first contract version that may contain a renderer-neutral `table` block.

The table primitive contains only authored structure and source identity:

- stable block id and source references;
- authored caption and optional description;
- ordered source-linked columns with stable ids and labels;
- ordered source-linked rows with stable ids;
- one ordered source-linked cell per column in every row;
- plain authored cell text.

It contains no HTML tags, CSS classes, column widths, pixel sizes, responsive breakpoints, colors, typography, sticky-header behavior or renderer layout hints.

A table block is therefore a semantic data-display primitive, not a web-table specification.

## Version compatibility

`SceneDocument 1.5` is additive to the existing contract chain.

- 1.0: base primitives;
- 1.1: diagrams;
- 1.2: charts and diagram states;
- 1.3: sequence diagrams;
- 1.4: definition lists;
- 1.5: tables.

A `table` block is invalid in a document declaring an earlier version. Version 1.5 remains valid for all primitives introduced in earlier versions.

This prevents older-version documents from silently carrying structure their declared contract did not require adapters to preserve.

## RDF authoring model

The canonical vocabulary adds:

- `cd:TableDefinition`;
- `cd:TableColumn`;
- `cd:TableRow`;
- `cd:TableCell`;
- `cd:hasTableColumn`;
- `cd:hasTableRow`;
- `cd:hasTableCell`;
- `cd:TableRole`.

`TableDefinition` is a `LearningResource`. Columns, rows and cells are structural resources with explicit positive positions. A SceneItem selects the table through `TableRole` and `cd:hasTableRow`.

The selection path is a semantic projection contract. It does not imply that rows alone constitute the table; the compiler projects the complete TableDefinition, including its columns, rows, cells, caption and description.

## SHACL constraints

Validation is fail-closed.

- a table requires at least one column and one row;
- every column, row and cell has exactly one owner;
- column positions are unique and contiguous from 1;
- row positions are unique and contiguous from 1;
- cell positions are unique and contiguous within each row;
- every row contains exactly one cell per table column;
- columns require authored labels;
- cells require authored body text;
- TableRole and `cd:hasTableRow` require each other;
- a SceneItem using TableRole must select a TableDefinition.

## Canonical compilation

The canonical compiler projects a TableDefinition into a SceneDocument `table` block without parsing presentation-oriented serialization.

It preserves:

- deterministic column/row/cell order;
- caption and optional description;
- stable identities;
- source references for the table, columns, rows and cells;
- selected language;
- provenance available through the existing source-reference mechanism.

Encountering a TableRole promotes the generated SceneDocument to version 1.5.

## Reveal compatibility

The Reveal adapter accepts SceneDocument 1.5 and maps table blocks into structured table render plans. The pitch projection renders semantic HTML with `table`, `caption`, `thead`, `tbody`, column-header `th` elements and `td` cells.

Layout and styling remain renderer-owned. For example, a renderer may place a table next to explanatory principles or next to an analytical chart, but that composition is inferred from SceneDocument structure and is not authored as CSS or RDF layout instructions.

## Self-study compatibility

The Self-Study adapter also accepts SceneDocument 1.5. It preserves the table as a structured plan and emits static semantic table HTML with source identities attached to columns, rows and cells.

A consumer that does not use the Reveal presentation layer therefore retains the same authored table structure.

## Migration

The CogniFlow reference presentation provided two initial migrations:

1. the FAIR data-object example;
2. the extracted feature-results table in the analytical-processing example.

Both were previously encoded as TSV CodeExamples. They are now TableDefinitions, and the pitch preview's `language === "tsv"` table heuristic has been removed.

Code blocks remain code. Tables remain tables.

## Consequences

- tabular structure is explicit and source-linked end to end;
- no renderer must infer rows or columns from delimiters;
- individual cells can participate in provenance and future interaction contracts;
- Reveal and Self-Study preserve the same table semantics;
- presentation-specific table sizing and responsive behavior remain renderer-owned;
- future spreadsheet/dataframe projections can consume the same semantic table block without changing authored RDF.
