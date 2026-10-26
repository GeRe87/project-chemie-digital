# TED talk visual revision

The talk now has 23 authored scenes, including the complete apparatus overview
before thermal decomposition and two final demonstration recordings.

## Assets and provenance

- IAC: supplied `LOGO.svg`, prepared by `scripts/prepare_ted_logos.py` into
  transparent light/dark derivatives with approved color adaptation.
- UDE: supplied `logo_claim_rgb.svg` and `logo_claim_rgb_negativ.svg`, copied
  unchanged as light/dark assets. No recoloring or geometry changes.
- OpenChrom: upstream artwork from
  `https://raw.githubusercontent.com/OpenChrom/openchrom/develop/openchrom/plugins/net.openchrom.rcp.compilation.community.ui/icons/logo.svg`.
  The original artwork is retained. Logo use does not imply endorsement.
- qAlgorithms: user-approved temporary text wordmark, not a replacement logo.
- Apparatus, upright Twister and in-house script: original schematic SVGs.

## Shared stages

`cd:NodePresentation` overrides a stable diagram node within one authored state.
The processing overview changes bodies and thumbnails only; marker selection
is unchanged. The alternative peak-finding stage preserves the original ports
and edges. Its label is illustrative, not evidence of improved performance.
Reduced-motion mode applies replacements without animation. Static alternatives
describe the variants as text.

TriG coloring escapes the source and highlights local prefixed names without
changing the displayed serialization. The left panel contains three prose cards.

## Video boundary

Both supplied recordings use the same normalized work-area crop with preserved
aspect ratio. Timed opaque overlays hide metadata, logs and file-selection names.
Mask coordinates are relative to the cropped viewport; times are seconds.
Playback pauses and resets on slide exit. Reduced-motion mode requires manual
playback. Static/self-study alternatives omit raw playback of masked videos.
Original recording assets remain unchanged and are not sanitized downloads.

Focused verification: 21 TED content checks, one TriG-highlighting test and
12 existing flow-renderer/state checks passed. The new NodePresentation and
MediaRedaction SHACL shapes conform against the assembled dataset. Browser
checks covered forward/reverse tool stages, normal/reduced-motion replacement
and video play/pause/reset. Both UDE copies are byte-identical to the supplied
originals.

Comprehensive validation remains deferred during authoring. Short browser
previews and focused content/regression checks are not full-suite acceptance,
publication, deployment or evidence of scientific/pedagogical effectiveness.
