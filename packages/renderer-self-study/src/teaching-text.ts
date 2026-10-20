import katex from "katex";

export function escapeStudyText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function renderStudyMath(expression: string, displayMode = false): string {
  return katex.renderToString(expression, {
    displayMode, output: "htmlAndMathml", throwOnError: false, trust: false,
  });
}

/** Explicit authored math delimiters only: no guessing from words or symbols.
 * Raw HTML is always escaped. Code spans never pass through the math parser. */
export function renderStudyInline(text: string): string {
  const tokens = /`([^`\n]+)`|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\*\*([^*\n]+)\*\*/gu;
  let result = "", end = 0;
  for (const match of text.matchAll(tokens)) {
    result += escapeStudyText(text.slice(end, match.index));
    if (match[1] !== undefined) result += `<code>${escapeStudyText(match[1])}</code>`;
    else if (match[4] !== undefined) result += `<strong>${escapeStudyText(match[4])}</strong>`;
    else result += renderStudyMath(match[2] ?? match[3]!);
    end = match.index! + match[0].length;
  }
  return result + escapeStudyText(text.slice(end));
}
