# Environmental Health 2026: recording runbook

## Boundary and prerequisites

This is an isolated authoring preview, not a publication or deployment. Do not modify hosting, production branches, the existing lecture worktree, shared assets or renderer code. The builder does not execute any command below. No technical, browser or recording success is claimed here.

Use Python 3.11+, Node.js 22+, npm, RDFLib and the repository's pinned dependencies, including pyshacl==0.40.0. Before running commands, activate the coordinator-prepared pinned Python venv. In PowerShell, require its VIRTUAL_ENV and explicitly prepend its Scripts directory to PATH:

```powershell
if (-not $env:VIRTUAL_ENV) { throw 'Activate the prepared pinned Python venv first.' }
$env:PATH = (Join-Path $env:VIRTUAL_ENV 'Scripts') + [IO.Path]::PathSeparator + $env:PATH
python -c "import os,sys,importlib.metadata as m; from pathlib import Path; assert Path(sys.prefix).resolve() == Path(os.environ['VIRTUAL_ENV']).resolve(); assert sys.version_info >= (3,11); assert m.version('pyshacl') == '0.40.0'"
```

Stop if preparation or verification fails. Missing executables or dependencies are infrastructure errors, not reasons to alter feature code.

## Collection generation and build

From this clone, the supplied collection compiler API can generate a disposable local artifact with this exact command. It includes the existing collection and its new additive member, not a replacement collection:

```text
python -c "import json,sys; sys.path.insert(0,'scripts'); from presentation_collection import build_collection_artifact; from pathlib import Path; p=Path('.local/eh26/collection.preview.json'); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(build_collection_artifact('https://w3id.org/project-chemie-digital/resource/talks'),ensure_ascii=False,indent=2),encoding='utf-8')"
npm run generate:talks
python -m unittest discover -s tests -p test_talks_environmental_health_2026.py
npm run test:talks
npm test
npm run build:talks
npm run check:talks-build
```

Verified package entry points: `npm run generate:talks` generates the Talks artifacts; `npm run build:talks` outputs `dist/talks`; `npm run check:talks-build` verifies that output. The normal `npm run talks:dev` uses loopback port 5186 with strictPort. For this isolated preview, first confirm port 5196 is free, then use:

```text
npm --workspace @project-chemie-digital/pitch exec -- vite --host 127.0.0.1 --port 5196 --strictPort
```

Open the direct recording preview: `http://127.0.0.1:5196/?theme=light&background=none&level=ex%3Apath-talk-environmental-health-2026--scene-document#/ex%3Aeh26-scene-01--scene`. This selects the existing quiet light appearance without the laboratory background. Never stop or replace an existing listener. If port 5196 is occupied, stop this preview attempt and coordinate another free port. The API generation command above uses the actual collection compiler, not a parallel scene implementation. See qa-report.md for observed results; these commands alone are not evidence of successful validation.

Keep preview local to this clone and bound to loopback. Open the Talks collection and select the full Environmental Health title. Confirm the selected path is `https://w3id.org/project-chemie-digital/resource/path-talk-environmental-health-2026`, in exact graph `https://w3id.org/project-chemie-digital/graph/paths/talk-environmental-health-2026`. Do not select or shorten the GERSTEL path. Do not upload or deploy the preview artifact.

## Stable recording copy

After a successful build and artifact check, prefer the built copy for rehearsal.
It needs a local HTTP server, not a development build or an internet connection.
From this clone, if no server is already listening on port 5197:

```text
python -m http.server 5197 --bind 127.0.0.1 --directory dist/talks
```

Open `http://127.0.0.1:5197/?theme=light&background=none&level=ex%3Apath-talk-environmental-health-2026--scene-document#/ex%3Aeh26-scene-01--scene`.
During coordinator review this dedicated server is already running. Open its URL
rather than starting a second listener. Keep the server terminal open during use;
do not stop another application's listener. This is a local recording copy and
does not alter the published lecture or hosting.

## Browser inspection before recording

- Use the locally tested Edge version (157.0.4341.42 during review) for the rehearsal. The older isolated Chromium 1208 test browser still showed intermittent stale chart-label painting. This browser choice does not change your normal browser profile or the existing lecture server.
- Select the existing light theme and a 16:9 viewport. Use the real Reveal.js renderer, not a separately reconstructed deck.
- Confirm twelve independent scenes and the first-scene heading From Signal to Evidence, local SBR evidence and two-point footer: full ScientificTalk title first, unchanged author/affiliation/event and replicate/uncertainty statement second. On chart scenes 01, 02, 04, 06, 07 and 08, inspect the visible key-point lists with their full scientific caveats.
- Navigate manually with the existing next/back controls. Turn off deck auto-advance. No selected calibration window has a timer; three static windows advance only on next. There are no selected videos or autoplay media.
- Enter each diagram directly in a fresh view. Its first state must already be non-empty. Check forward and backward navigation, including the reused core diagram on slides 05 and 12.
- Check all five existing marker-chart stages, all three static calibration windows, both SHACL states and all new flow states. Do not describe the synthetic chromatogram as measured data or as qPeaks output.
- Confirm all seven processing labels recur on slide 09 and all authored provenance parts remain legible. Essential scientific caveats must remain visible without opening a dialog.
- Inspect reduced-motion behavior, keyboard-only navigation, focus visibility and contrast. Confirm labels, charts and statements are readable at reduced playback size.
- Keep the lower frame clear enough for two lines of Persian subtitles. The existing slide footer contains essential scientific caveats and is not a subtitle band. Suggested recording composition: a 1920 x 1080 canvas, the 16:9 presentation fitted into at most 1664 x 936 pixels at x=128, y=0, and a separate 144-pixel lower band. This is a capture proposal, not a conference export requirement. Crop or exclude clock/navigation controls only if all scientific slide content remains visible. Check an actual Persian subtitle sample before final export. A generic deck-only chart-caption spacing repair was necessary; no original GERSTEL semantic resources were changed.
- Inspect static/PDF alternatives: complete chain, provenance descriptions, three FIFO memberships and SHACL before/after meaning must survive without clicks.
- Open the existing talk as well and confirm its 29-scene projection and normal navigation remain intact. New unit tests compare its actual compiler output before and after the additive dataset is loaded.

## Rehearsal and capture

Observed manual navigation in the recording browser:

| Scene | Additional next presses after its automatic initial state |
|---|---:|
| 01 | 0 |
| 02 | 0 |
| 03 | 0 |
| 04 | 4 |
| 05 | 4 |
| 06 | 4 |
| 07 | 2 |
| 08 | 0 |
| 09 | 4 |
| 10 | 1 |
| 11 | 2 |
| 12 | 4 |

There are 25 internal reveal actions and 11 changes between the twelve scenes.
Follow the paragraph cues in storyboard.md. Stop after the fully revealed closing
scene; do not count a further exit action as part of the talk. The three sample
result plots show both groups on entry; their runtime's single stage does not
require an extra click.

The authored target is 14:30, including all pointing, pauses, manual reveals and slide changes. Hard stop: 15:00. The storyboard's scene intervals are production budgets, not measured media timestamps. Rehearse with a stopwatch using the real stage sequence. Slide 12 has only 35 seconds; its four short next actions accompany the closing paragraphs.

The speaker records the English voice. No synthetic speech is required. Check microphone level, room noise and intelligibility, then record the screen and speaker audio together or synchronize them from an actual recorded cue. Keep mouse movement quiet and avoid notifications, unrelated windows, private paths and account information in the captured frame.

Use the conference's confirmed delivery settings for final export; no codec, resolution, frame rate or upload requirement was supplied. Inspect the entire resulting video and measure its actual duration before delivery. If too long, approve a versioned text/stage simplification and re-record. Do not extend the limit or mislabel accelerated speech as the original recording.

## Transcript and subtitle handoff

`transcript.en.txt` is the scene-labelled English source. `manuscript-v1.md` retains the original speaker text. After recording, derive real scene boundaries and subtitle timings from the actual audio/video. Supply the English transcript and measured timings to the organizers for Persian subtitles. Do not treat storyboard intervals as SRT timestamps. Confirm Persian subtitle framing with a real sample before final export.

Conference: 29th National and 10th International Conference on Environmental Health, hosted by Bushehr University of Medical Sciences, Iran. Dates: 15 to 17 December 2026. Video due: 15 November 2026. These are user-supplied planning facts, not externally verified information. Delivery and public release need human approval.
