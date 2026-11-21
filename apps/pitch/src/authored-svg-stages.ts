/** Presentation metadata lives on the authored SVG, never in a scene-ID registry. */
export function svgStageContract(count: string | null, mode: string | null) {
  if (!count || !/^[1-4]$/u.test(count) || !['exclusive', 'cumulative'].includes(mode ?? 'exclusive')) return undefined;
  return { count: Number(count), mode: mode ?? 'exclusive' };
}

export function mountAuthoredSvgStages(root: ParentNode, print: boolean): void {
  for (const figure of root.querySelectorAll<HTMLElement>('figure[data-media-type="image/svg+xml"]')) {
    const svg = figure.querySelector('svg[data-teaching-stage-count]');
    if (!svg) continue;
    const contract = svgStageContract(svg.getAttribute('data-teaching-stage-count'), svg.getAttribute('data-teaching-stage-mode'));
    if (!contract) continue;
    figure.dataset.presentationStepCount = String(contract.count);
    figure.dataset.svgStageMode = contract.mode;
    const update = (step: number) => {
      figure.dataset.svgStageActive = String(Math.max(0, Math.min(contract.count, step)));
      for (const group of svg.querySelectorAll<SVGElement>('[data-svg-stage]')) {
        const at = Number(group.dataset.svgStage);
        const visible = at === step || (contract.mode === 'cumulative' && at > 0 && at <= step);
        group.setAttribute('aria-hidden', String(!visible));
      }
    };
    update(print ? contract.count : 0);
    if (!print) figure.addEventListener('pcd-presentation-step', event => {
      update((event as CustomEvent<{step: number}>).detail.step);
    });
  }
}
