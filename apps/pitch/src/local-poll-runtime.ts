export interface LocalPollRuntimeController {
  destroy(): void;
}

export function isCorrectSingleChoice(correctOptionId: string, selectedOptionId: string): boolean {
  return correctOptionId === selectedOptionId;
}

export function mountLocalChoicePolls(root: ParentNode): LocalPollRuntimeController {
  const shells = [...root.querySelectorAll<HTMLElement>('.live-poll[data-correct-option-id]')];
  const cleanup: Array<() => void> = [];

  for (const shell of shells) {
    const correctOptionId = shell.dataset.correctOptionId;
    if (!correctOptionId) continue;
    const buttons = [...shell.querySelectorAll<HTMLButtonElement>(".poll-option-button[data-poll-option-id]")];
    const feedback = shell.querySelector<HTMLElement>('[data-poll-local-feedback="true"]');
    const status = feedback?.querySelector<HTMLElement>(".poll-local-feedback-status");
    if (!feedback || !status || buttons.length < 2) continue;

    const stopDeckKeyboard = (event: KeyboardEvent): void => event.stopPropagation();
    shell.addEventListener("keydown", stopDeckKeyboard);

    const listeners: Array<readonly [HTMLButtonElement, () => void]> = [];
    for (const button of buttons) {
      const select = (): void => {
        const selectedOptionId = button.dataset.pollOptionId;
        if (!selectedOptionId) return;
        const correct = isCorrectSingleChoice(correctOptionId, selectedOptionId);
        shell.dataset.pollAnswered = "true";
        shell.dataset.pollAnswerCorrect = String(correct);
        status.textContent = correct ? "Correct." : "Not quite.";
        feedback.dataset.feedbackState = correct ? "correct" : "incorrect";
        feedback.removeAttribute("hidden");

        for (const candidate of buttons) {
          const candidateId = candidate.dataset.pollOptionId;
          const selected = candidate === button;
          candidate.setAttribute("aria-pressed", String(selected));
          candidate.classList.toggle("is-selected", selected);
          candidate.classList.toggle("is-correct", candidateId === correctOptionId);
          candidate.classList.toggle("is-incorrect", selected && candidateId !== correctOptionId);
        }
      };
      button.addEventListener("click", select);
      listeners.push([button, select]);
    }

    cleanup.push(() => {
      shell.removeEventListener("keydown", stopDeckKeyboard);
      for (const [button, listener] of listeners) button.removeEventListener("click", listener);
      shell.removeAttribute("data-poll-answered");
      shell.removeAttribute("data-poll-answer-correct");
      feedback.setAttribute("hidden", "");
      feedback.removeAttribute("data-feedback-state");
      status.textContent = "";
      for (const button of buttons) {
        button.setAttribute("aria-pressed", "false");
        button.classList.remove("is-selected", "is-correct", "is-incorrect");
      }
    });
  }

  let destroyed = false;
  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      for (const remove of cleanup.reverse()) remove();
    },
  };
}
