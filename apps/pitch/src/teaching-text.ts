export function escapeTeachingText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** A deliberately small safe Markdown subset: paragraphs, strong text, unordered lists.
 * Marker purpose comes from the enclosing semantic block, never punctuation. */
export function teachingTextMarkup(text: string, purpose: "question" | "statement" | "neutral" = "neutral"): string {
  const inline = (value: string): string => escapeTeachingText(value).replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>");
  return text.split(/\r?\n\s*\r?\n/u).map(paragraph => {
    const lines = paragraph.split(/\r?\n/u);
    if (lines.every(line => /^-\s+/u.test(line))) {
      return `<ul class="teaching-points" data-marker-purpose="${purpose}">${lines.map(line => `<li><span class="teaching-point-marker" aria-hidden="true"></span>${inline(line.replace(/^-\s+/u, ""))}</li>`).join("")}</ul>`;
    }
    return `<p>${inline(paragraph).replaceAll("\n", "<br>")}</p>`;
  }).join("");
}
