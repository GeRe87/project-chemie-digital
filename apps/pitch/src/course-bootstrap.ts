export interface CourseBootstrapStatus {
  ready(): void;
  failed(error: unknown): void;
}

/** One failure boundary covers manifest/fetch/import/initialization failures.
 * Retry reloads the page, so partially mounted renderers are never mounted twice. */
export async function runCourseBootstrap(start: () => Promise<void>, status: CourseBootstrapStatus): Promise<boolean> {
  try {
    await start();
    status.ready();
    return true;
  } catch (error) {
    status.failed(error);
    return false;
  }
}

export function mountCourseBootstrapStatus(
  owner: Document,
  options: { readonly staticHref: string; readonly retry: () => void; readonly showStandaloneFallback?: () => void },
): CourseBootstrapStatus {
  const shell = owner.createElement("section");
  shell.className = "pcd-bootstrap-status";
  shell.setAttribute("role", "status");
  shell.setAttribute("aria-live", "polite");
  const card = owner.createElement("div");
  card.className = "pcd-bootstrap-card";
  const heading = owner.createElement("h1");
  heading.textContent = "Loading course…";
  heading.tabIndex = -1;
  const message = owner.createElement("p");
  message.textContent = "Preparing the course navigation and selected content.";
  const retry = owner.createElement("button");
  retry.type = "button";
  retry.textContent = "Retry loading";
  retry.hidden = true;
  retry.addEventListener("click", options.retry);
  const fallback = owner.createElement("a");
  fallback.href = options.staticHref;
  fallback.textContent = "Open static course content";
  card.append(heading, message, retry, fallback);
  shell.append(card);
  owner.body.append(shell);
  return {
    ready() { shell.remove(); },
    failed(error) {
      shell.setAttribute("role", "alert");
      shell.setAttribute("aria-live", "assertive");
      shell.dataset.state = "error";
      heading.textContent = "The course could not be loaded";
      message.textContent = error instanceof Error ? error.message : "An unexpected loading error occurred.";
      retry.hidden = false;
      // Release the viewport for the local fallback if standalone generation is
      // used. The static course link is a separate bundled file in course mode.
      for (const element of owner.querySelectorAll<HTMLElement>(".reveal, .pitch-course-world-shell, #view-switch-shell")) element.hidden = true;
      options.showStandaloneFallback?.();
      heading.focus();
    },
  };
}
