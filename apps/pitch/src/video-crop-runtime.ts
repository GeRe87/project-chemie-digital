/** Presentation crops/redactions leave the original recordings unchanged. */
export function mountCroppedVideos(root: ParentNode): () => void {
  const cleanup: Array<() => void> = [];
  for (const viewport of root.querySelectorAll<HTMLElement>(".pcd-cropped-video")) {
    const video = viewport.querySelector("video"), figure = viewport.parentElement, button = figure?.querySelector<HTMLButtonElement>("[data-video-toggle]");
    if (!video || !figure || !button) continue;
    video.muted = true;
    const fit = () => {
      const width = video.videoWidth * Number(viewport.dataset.cropWidth), height = video.videoHeight * Number(viewport.dataset.cropHeight);
      if (!width || !height || !figure.clientWidth || !figure.clientHeight) return;
      const scale = Math.min(figure.clientWidth / width, figure.clientHeight / height);
      viewport.style.width = `${width * scale}px`; viewport.style.height = `${height * scale}px`;
    };
    const updateMasks = (time: number) => {
      for (const mask of viewport.querySelectorAll<HTMLElement>(".pcd-video-redaction")) mask.hidden = time < Number(mask.dataset.redactionStart) || time >= Number(mask.dataset.redactionEnd);
    };
    const update = () => {
      button.textContent = video.paused ? "Play video" : "Pause video";
      updateMasks(video.currentTime);
    };
    let frame: number | undefined;
    const onFrame: VideoFrameRequestCallback = (_now, metadata) => {
      updateMasks(metadata.mediaTime);
      frame = video.requestVideoFrameCallback(onFrame);
    };
    if (typeof video.requestVideoFrameCallback === "function") frame = video.requestVideoFrameCallback(onFrame);
    const toggle = () => { video.paused ? void video.play().catch(() => {}) : video.pause(); };
    button.addEventListener("click", toggle);
    for (const name of ["timeupdate", "seeked", "play", "pause"]) video.addEventListener(name, update);
    video.addEventListener("loadedmetadata", fit);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(fit); observer?.observe(figure);
    fit(); update();
    cleanup.push(() => { if (frame !== undefined) video.cancelVideoFrameCallback(frame); button.removeEventListener("click", toggle); observer?.disconnect(); video.removeEventListener("loadedmetadata", fit); for (const name of ["timeupdate", "seeked", "play", "pause"]) video.removeEventListener(name, update); });
  }
  return () => cleanup.forEach(remove => remove());
}
