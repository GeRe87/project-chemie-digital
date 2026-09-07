export interface BackgroundProgressSource {
  readonly kind: "scroll" | "deck";
  start(listener: (offset: number) => void): () => void;
  current(): number;
}

export interface ScrollProgressPort {
  getOffset(): number;
  addScrollListener(listener: () => void): () => void;
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(handle: number): void;
}

export function createScrollProgressSource(port: ScrollProgressPort): BackgroundProgressSource {
  let last = port.getOffset();
  let frame: number | undefined;
  return {
    kind: "scroll",
    current: () => port.getOffset(),
    start(listener) {
      const emit = () => {
        frame = undefined;
        last = port.getOffset();
        listener(last);
      };
      listener(last);
      const remove = port.addScrollListener(() => {
        if (frame !== undefined) return;
        frame = port.requestAnimationFrame(emit);
      });
      return () => {
        remove();
        if (frame !== undefined) {
          port.cancelAnimationFrame(frame);
          frame = undefined;
        }
      };
    },
  };
}

export interface DeckProgressPort {
  getSlideIndex(): number;
  addSlideChangedListener(listener: () => void): () => void;
}

export function createDeckProgressSource(port: DeckProgressPort, stepPx = 1000): BackgroundProgressSource {
  if (!Number.isFinite(stepPx) || stepPx <= 0) throw new Error("Deck progress step must be a positive finite number");
  const offset = () => Math.max(0, port.getSlideIndex()) * stepPx;
  return {
    kind: "deck",
    current: offset,
    start(listener) {
      listener(offset());
      return port.addSlideChangedListener(() => listener(offset()));
    },
  };
}
