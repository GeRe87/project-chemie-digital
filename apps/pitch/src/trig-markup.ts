/** Conservative lexical coloring. Source text is escaped and never executed. */
export function trigMarkup(source: string): string {
  const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const tokens = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<[^>]*>|#[^\n]*|(?:[A-Za-z_][\w-]*)?:[A-Za-z_][\w.-]*/gu;
  let out = "", last = 0;
  for (const match of source.matchAll(tokens)) {
    const start = match.index!, token = match[0]; out += escape(source.slice(last, start));
    if (/^(?:[A-Za-z_][\w-]*)?:[A-Za-z_]/u.test(token)) {
      const colon = token.indexOf(":"), local = token.slice(colon + 1);
      const hue = [...local].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 0);
      out += `${escape(token.slice(0, colon + 1))}<strong class="trig-local-name" style="--trig-token-hue:${hue}">${escape(local)}</strong>`;
    } else out += escape(token);
    last = start + token.length;
  }
  return out + escape(source.slice(last));
}
