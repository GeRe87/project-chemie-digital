export interface PageLifecycleHooks {
  pause?(): void;
  resume?(): void;
  destroy(): void;
}

/** BFCache retains the mounted document; only a final departure disposes it. */
export function mountPageLifecycle(
  target: Pick<Window, "addEventListener" | "removeEventListener">,
  hooks: PageLifecycleHooks,
): () => void {
  let destroyed = false;
  let suspended = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    target.removeEventListener("pagehide", hide);
    target.removeEventListener("pageshow", show);
    hooks.destroy();
  };
  const hide = (event: PageTransitionEvent) => {
    if (event.persisted) {
      if (!suspended && !destroyed) { suspended = true; hooks.pause?.(); }
    } else destroy();
  };
  const show = (event: PageTransitionEvent) => {
    if (event.persisted && suspended && !destroyed) { suspended = false; hooks.resume?.(); }
  };
  target.addEventListener("pagehide", hide);
  target.addEventListener("pageshow", show);
  return destroy;
}
