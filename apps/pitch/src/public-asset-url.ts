/**
 * Resolve repository-owned root-relative public assets against the page that hosts
 * the presentation. This keeps semantic media and background packs working both at
 * localhost root and when the built site is served below a GitHub Pages subpath.
 *
 * External, protocol-relative, data, blob and already-relative URLs are left intact.
 * In non-browser tests there is no document base, so root-relative URLs stay unchanged.
 */
export function resolvePublicAssetUrl(uri: string, baseHref?: string): string {
  if (!uri.startsWith("/") || uri.startsWith("//")) return uri;

  const effectiveBase = baseHref
    ?? (typeof document !== "undefined" ? document.baseURI : undefined);

  if (!effectiveBase) return uri;

  return new URL(uri.slice(1), effectiveBase).toString();
}
