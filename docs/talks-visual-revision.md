# TED talk visual revision

The talk now has 25 authored scenes, including the complete apparatus overview
before thermal decomposition, two demonstration recordings, an AI/MCP finale
and a closing thank-you slide.

## Assets and provenance

- IAC: supplied `LOGO.svg`, prepared by `scripts/prepare_ted_logos.py` into
  transparent light/dark derivatives with approved color adaptation.
- UDE: supplied `logo_claim_rgb.svg` and `logo_claim_rgb_negativ.svg`, copied
  unchanged as light/dark assets. No recoloring or geometry changes.
- OpenChrom: upstream artwork from
  `https://raw.githubusercontent.com/OpenChrom/openchrom/develop/openchrom/plugins/net.openchrom.rcp.compilation.community.ui/icons/logo.svg`.
  The original artwork is retained. Logo use does not imply endorsement.
- qAlgorithms: speaker-supplied `qalgorithms_logo.webp`, copied unchanged from
  the supplied Desktop file. The earlier temporary wordmark is no longer selected.
- Apparatus, upright Twister and in-house script: original schematic SVGs.

## Shared stages

`cd:NodePresentation` overrides a stable diagram node within one authored state.
The processing overview changes bodies and thumbnails only; both marker selection
and calibration show the in-house script with Python. Square image viewports
preserve logo proportions and reserve enough vertical space. The alternative peak-finding stage preserves the original ports
and edges. Its label is illustrative, not evidence of improved performance.
Its orange card distinguishes the replacement by color as well as label.
Reduced-motion mode applies replacements without animation. Static alternatives
describe the variants as text.

TriG coloring escapes the source and highlights local prefixed names and quoted literals without
changing the displayed serialization. The left panel contains three prose cards.

## Video boundary

Both supplied recordings use the same normalized crop with preserved aspect
ratio. The speaker's revised approval permits metadata and names in the videos:
the semantic documentation sidebar and logs are visible, without masking.
Only browser chrome is cropped away. The shared framed-media composition keeps
the ordinary laboratory background visible around both recordings and enlarges
the apparatus overview. The GC column coil is centered within its enclosure.
Playback pauses and resets on slide exit. Reduced-motion mode requires manual
playback. Original recording assets remain unchanged. Generic support for masked
media remains available, but these two videos no longer request redactions.

## Interfaces, local calibration and AI

The closing slide displays “Thank you for your attention”, a local QR code and
the readable address `talks.odea-project.org`. Its direct HTTPS target is authored
in `talks-ted-thanks.trig`. `scripts/prepare_ted_website_qr.py` regenerates the
asset from that RDF target using optional build dependency `segno==1.6.6`.
Black modules, a white background and a four-module quiet zone preserve scanning
contrast in either theme. No QR-service request, redirect or tracking is added.

The sample-result slide now selects only the two local-fit groups. Historical
neighboring-window calculations remain as unselected source evidence, not visible
series. A prominent processing-step takeaway explains why input/output meaning,
structure and constraints must be documented in addition to the algorithm.

The four port dialogs now use `talks-ted-interface-excerpts.trig`: names and
definitions in SKOS, ProcessingStep/Port/hasPort/portKey/hasPortRole from the
speaker-specified `stonecastle/cf_concept_processing`, and small SHACL shapes
for port documentation. Source digests are recorded in RDF. `cf_ontology` is not
redefined. Older processing meta-properties absent from the inspected core are
not copied. `dct:conformsTo` links a descriptor to its teaching shape; it is not
presented as an upstream-specific payload contract. These are partial excerpts,
not claims of full upstream or production conformance. Older detailed proposed
payload schemas remain unselected evidence. Generated TriG preserves the exact
selected named graphs, with anonymous property constraints rendered inline.

The final AI diagram separates proposing an explicit workflow, discovering and
calling registered operations through MCP, and validated execution. The inspected
MCP README describes a service-call gateway, not a separate MCP tool name for
every operation. Reproducible execution needs fixed inputs, parameters, versions
and suitable implementations; structural checks do not guarantee hallucination-free
planning or scientific correctness. The slide makes this distinction explicit.

Focused verification passed: 25 talk-content checks and 72 TypeScript checks for
highlighting, composition and flow state behavior. The content checks include
descriptor SHACL validation and rejected missing definitions.
Browser previews cover overview sizing, the five tool images, the local-only
chart, the interface callout, changed-card color, visible video metadata and the
AI finale. Both UDE originals remain unchanged.
The closing QR code was decoded successfully from the actual rendered slide in
both light and dark themes, resolving to `https://talks.odea-project.org`.

Comprehensive validation remains deferred during authoring. Short browser
previews and focused content/regression checks are not full-suite acceptance,
publication, deployment or evidence of scientific/pedagogical effectiveness.
