# Semantic timeline charts

## Ownership and contract

`cd:TimelineChart` is an additive chart type projected into **SceneDocument 1.13**.
TriG supplies schedule facts; the shared D3 renderer supplies geometry, theme,
responsive scrolling and stage behavior. No scene IDs, CSS classes, pixels,
palette values, executable scheduling functions or next-operation edges belong
in the authored graph. This is a visualization of an authored schedule, **not**
an operation executor, optimizer or proof that a physical process is feasible.

The standard supports instrument occupancy, repeated preparation phases and
other periodic interval schedules. It is not restricted to TED, samples/blanks,
two instruments, minute units or a particular collection.

## RDF authoring

- A normal `cd:ChartDefinition` selects `cd:TimelineChart`, axis labels and a time
  unit through the existing chart vocabulary.
- `cd:usesDataset` selects the primary `cd:Dataset, cd:TimelineSchedule`.
  Optional `dct:hasPart` links additional schedule datasets. Their `cd:position`
  values give a unique contiguous comparison order starting at 1.
- `cd:hasTimelineCategory` lists ordered, labelled `cd:TimelineCategory` resources.
  This is the authored phase legend; renderer palette tokens are not identities.
- `cd:hasTimelineRun` lists ordered, labelled `cd:TimelineRun` resources. Each lane
  repeats its phases for each of these runs. Short run labels need a visible
  explanation when abbreviations are used.
- A schedule links ordered `cd:TimelineLane` resources through
  `cd:hasTimelineLane`. A lane supplies its label, `cd:startOffset` from time zero
  and `cd:repeatEvery`, the time between successive run starts on that lane.
- `cd:hasTimelineInterval` links ordered phase templates. Each `cd:TimelineInterval`
  gives `cd:startOffset` within its run, positive `cd:duration`, and a known
  `cd:intervalCategory`.
- Timings are decimals in the chart's time unit. Starts are nonnegative; repeat
  periods and durations are positive. Phases must be ordered, non-overlapping
  and fit inside their lane's repeat period. Idle periods are the gaps between
  intervals; they are not additional fabricated observations.
- All these resources carry `cd:authoredResource true`. Attach scientific source
  records and state whether timings are modeled, estimated or measured.

For example, a lane starting at 12 s, repeating every 40 s, with a phase beginning
at offset 3 s and lasting 8 s yields intervals 15–23 s, 55–63 s, and so on for the
authored run list. This expansion is disposable transport derived from RDF, not
another authored source. There is no inference from resource names or ordering
of unrelated operations.

`ontology/dataset/timeline-charts.trig` declares the vocabulary and SHACL shapes.
The compiler additionally checks contiguous ordering, resource types, legend
membership and interval bounds. Projected interval provenance includes the lane
start/period, phase start/duration/category and run identity/position. Projected
IDs compose these source identities; generated intervals are not new authored RDF.

## Rendering and alternatives

`TimelineChartBlock` contains `categories` and ordered `scenarios`, each with
ordered `lanes` and explicit `intervals`. Every interval has `id`, run `label`,
numeric `start`/`end`, `categoryId`, and `source`. Core validation rejects unknown
categories, nonfinite/inverted/overlapping intervals and duplicate identities.
Old SceneDocument versions remain supported; only timeline documents require 1.13.

A single scenario is immediately visible. Comparisons use the existing
presentation-step runtime to reveal scenarios cumulatively in authored order,
including backward navigation. Their **shared time domain** remains fixed so
shorter schedules cannot appear longer through independent rescaling. Displayed
completion times derive from maximum interval ends, not separate label constants.
Reduced motion removes transitions. Category and run labels, tooltips and complete
text alternatives preserve meaning without colour alone.

The existing heading + chart + concise takeaways composition is reused. The only
new CSS concerns the generic timeline primitive. Narrow viewports use a focusable
horizontal scroll region rather than shrinking all labels to illegible sizes.
There is no new per-scene composition family. Static Python exports, Pitch text
alternatives, semantic tables, Reveal's static adapter and self-study fallback
all retain interval values without requiring interactive SVG.

## Talks source migration

The author-supplied `renner_workshop_microplastics.html` was read, not copied into
the application. Its source SHA-256 is
`29cfc1ceeadcd3a870ad2ca41ef6930ec2ce537dc8297dca5f07407a5c23472f`.
Only timings, five approximately digitized heating-study values, credit and
scientific narrative were transcribed into `talks-ted-throughput*.trig`.

The six-run totals are 630, 423 and 338 min. The original serial and nested
models also change TGA cleaning duration (22 versus 38 min), so the first saving
is not presented as an isolated overlap experiment. Sorbent transfer and buffering
remain assumptions. The heating chart reuses the existing line-chart primitive:
the lowest **sampled** value is at 15 °C/min. No raw-data precision, unspecified
response unit, fitted optimum or universal performance claim is invented.

Focused regression cases are prepared in the core and content tests. As requested
by the owner, comprehensive validation is deferred until the talk is finished.
