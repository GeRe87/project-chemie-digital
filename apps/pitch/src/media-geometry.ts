/** Image geometry is a renderer hint, not an authored scientific assertion. */
export function isPanoramicMedia(width: number, height: number): boolean {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width / height >= 2.5;
}

export function installMediaGeometryHints(root: ParentNode): () => void {
  const cleanups: (() => void)[] = [];
  for (const image of root.querySelectorAll<HTMLImageElement>('.media-reference img')) {
    const figure = image.closest<HTMLElement>('.media-reference');
    if (!figure) continue;
    const update = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        figure.setAttribute('data-media-aspect', isPanoramicMedia(image.naturalWidth, image.naturalHeight) ? 'panoramic' : 'standard');
      }
    };
    image.addEventListener('load', update);
    if (image.complete) update();
    cleanups.push(() => { image.removeEventListener('load', update); figure.removeAttribute('data-media-aspect'); });
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
