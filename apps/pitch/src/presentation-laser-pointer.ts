export function mountPresentationLaserPointer(presentation: HTMLElement): () => void {
  const finePointer = window.matchMedia("(pointer: fine)");
  if (!finePointer.matches) return () => undefined;

  const documentRef = presentation.ownerDocument;
  const pointer = documentRef.createElement("div");
  pointer.className = "presentation-laser-pointer";
  pointer.setAttribute("aria-hidden", "true");
  documentRef.body.append(pointer);
  documentRef.body.classList.add("pcd-presentation-laser-pointer");

  let visible = false;

  const setVisible = (next: boolean): void => {
    if (visible === next) return;
    visible = next;
    pointer.classList.toggle("is-visible", next);
  };

  const move = (event: PointerEvent): void => {
    if (event.pointerType === "touch") {
      setVisible(false);
      return;
    }
    pointer.style.setProperty("--laser-x", `${event.clientX}px`);
    pointer.style.setProperty("--laser-y", `${event.clientY}px`);
    setVisible(true);
  };

  const enter = (event: PointerEvent): void => move(event);
  const leave = (): void => setVisible(false);
  const blur = (): void => setVisible(false);

  presentation.addEventListener("pointerenter", enter);
  presentation.addEventListener("pointermove", move);
  presentation.addEventListener("pointerleave", leave);
  window.addEventListener("blur", blur);

  return () => {
    presentation.removeEventListener("pointerenter", enter);
    presentation.removeEventListener("pointermove", move);
    presentation.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", blur);
    documentRef.body.classList.remove("pcd-presentation-laser-pointer");
    pointer.remove();
  };
}
