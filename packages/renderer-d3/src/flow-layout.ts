/** Renderer-only text layout; measurements are in SVG user units, not CSS rems. */
export function wrapFlowText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/u)) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/u).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      // Break unspaced identifiers without discarding text or splitting graphemes.
      for (const { segment } of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word)) {
        if (line && measure(line + segment) > maxWidth) {
          lines.push(line);
          line = "";
        }
        line += segment;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Three square steps at each corner, with no curves or diagonal segments. */
export function flowPixelPath(x: number, y: number, width: number, height: number, pixel = 4): string {
  const r = pixel * 3;
  const right = x + width;
  const bottom = y + height;
  return `M ${x + r} ${y} H ${right - r} V ${y + pixel} H ${right - pixel * 2} V ${y + pixel * 2} H ${right - pixel} V ${y + r} H ${right} V ${bottom - r} H ${right - pixel} V ${bottom - pixel * 2} H ${right - pixel * 2} V ${bottom - pixel} H ${right - r} V ${bottom} H ${x + r} V ${bottom - pixel} H ${x + pixel * 2} V ${bottom - pixel * 2} H ${x + pixel} V ${bottom - r} H ${x} V ${y + r} H ${x + pixel} V ${y + pixel * 2} H ${x + pixel * 2} V ${y + pixel} H ${x + r} Z`;
}
