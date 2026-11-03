# Print the presentation as slides

Use **Slides PDF** in the presentation toolbar. It opens a separate tab containing
the same selected lecture in Reveal's print view, not the narrative script.
Wait for **Ready to print**, then choose **Print / Save slides as PDF**.

- One landscape PDF page per slide, including the lecture title when present.
- All fragment steps appear together, not as additional pages; speaker notes and
  presentation controls are excluded.
- The existing slide aspect ratio is retained. Use the browser's built-in
  **Save as PDF**, 100% scale, no margins, and no browser headers/footers. Enable
  background graphics. For paper printing, choose landscape and fit to paper.
- Formula legends and locally authored graphics remain part of the slide.
- Interactive examples are static. R is not executed and transient live results
  are not copied from the original tab. This is not a replacement for the script.
- Close the tab or use **Back to presentation** to return to the slide view.

Direct preview link:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1&theme=light&print-pdf>

The print link preserves lecture selection and theme, removes the script mode and
live-execution flag, and starts from the full deck rather than the current hash.
The renderer uses a fixed 1440 × 900 canvas even when opened from a phone. No RDF
content, scene selection or self-study rendering contract is changed by printing.
Loading waits for fonts, local teaching SVGs and images. An image failure leaves
the print action disabled with a visible status message.

## Local verification

Six focused Node tests pass. The pitch production build passes, with existing
large-chunk warnings. A real Edge PDF export of the current local lecture contains
112 landscape pages, matching 111 scenes plus the title. All pages contain
extractable text; there are no empty or extra fragment pages. Native page size is
1123 × 702 points, preserving the slide ratio rather than forcing A4 cropping.
The link, print action, return to presentation and unchanged script-print view pass
browser checks in Edge and Firefox. All 112 print pages pass a visible-content
boundary check for headings, formula displays, symbol legends, tables and captions
in both browsers. Following the independent November review, fitting excludes
KaTeX's invisible internal geometry, preserves the renderer's grid/flex layout and
does not apply screen-only responsive reflow in native print. The minimum measured
scale is approximately 72.6%, not the earlier undetected 7–11% on some pages. A
saved-PDF prose/legend/caption comparison complements browser geometry checks.
Dense slides can still have smaller text. This does
not certify all interactive content states or repair the existing phone layouts.
Firefox native PDF saving still requires manual verification.

See [review implementation status](chemometrics-level5-review-implementation.md)
for the remaining 66-slide condensation, experiment and readability work.

No PDF is published or committed. Local audit output is in the approved OpenCode
temporary directory (`level5-slides.pdf`, `slides-pdf-sample.png`).
