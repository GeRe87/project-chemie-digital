export function escapeTeachingText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** Stable symbol colors are presentation tokens, never scientific identities. */
export function symbolLegendMarkup(text:string):string {
  const tones:Readonly<Record<string,number>>={n:1,i:2,"Σ":3,"Σᵢ":3,"xᵢ":4,"x̄":5,"m₂":1,"m₃":2,"m₄":4,K:5,"g₁":3,"g₂":2,s:4,r:2,"a₁":5,"a₂":1,"a₃":2,"a₄":4,"bᵣ":3};
  return text.split(/([\p{L}\p{M}₀-₉Σ√]+(?:[₀-₉])?)/gu).map(token=>{
    const symbol=/^[\p{L}\p{M}₀-₉Σ√]+$/u.test(token)&&token!=="a"&&(token.length===1||/^[A-Z]{2,3}$/u.test(token)||/[₀-₉ₐ-ₜᵢ-ᵥⱼ\p{M}Σ√]/u.test(token));
    if(!symbol)return escapeTeachingText(token);
    const hash=Array.from(token.normalize("NFC")).reduce((n,c)=>Math.imul(n^c.codePointAt(0)!,16777619)>>>0,2166136261);
    return `<span class="pcd-math-symbol pcd-math-symbol-${tones[token]??hash%5+1}">${escapeTeachingText(token)}</span>`;
  }).join("");
}

export function teachingInlineMarkup(text: string, symbols=false): string {
  return (symbols?symbolLegendMarkup(text):escapeTeachingText(text)).replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(/==([^=]+)==/gu, '<span class="pcd-marker-highlight pcd-marker-highlight--cyan">$1</span>');
}

/** A deliberately small safe Markdown subset. List purpose uses explicit [!] / [?] markers. */
export function teachingTextMarkup(text: string): string {
  const inline = teachingInlineMarkup;
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
