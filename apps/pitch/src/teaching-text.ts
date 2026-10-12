export function escapeTeachingText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** A deliberately small safe Markdown subset. List purpose uses explicit [!] / [?] markers. */
export function teachingTextMarkup(text: string): string {
  const inline = (value: string): string => escapeTeachingText(value).replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>");
  return text.split(/\r?\n\s*\r?\n/u).map(paragraph => {
    const lines = paragraph.split(/\r?\n/u);
    if (lines.every(line => /^-\s+/u.test(line))) {
      return `<ul class="teaching-points">${lines.map(line => {
        const match = /^-\s+\[([?!])\]\s+([\s\S]*)$/u.exec(line);
        const markerPurpose = match?.[1] === "?" ? "question" : match?.[1] === "!" ? "task" : "neutral";
        const content = match ? match[2]! : line.replace(/^-\s+/u, "");
        return `<li data-marker-purpose="${markerPurpose}"><span class="teaching-point-marker" aria-hidden="true"></span>${inline(content)}</li>`;
      }).join("")}</ul>`;
    }
    return `<p>${inline(paragraph).replaceAll("\n", "<br>")}</p>`;
  }).join("");
}
