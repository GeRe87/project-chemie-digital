type ClockParts = {
  hours: string;
  minutes: string;
  meridiem: "am" | "pm";
};

function clockParts(date: Date): ClockParts {
  const rawHours = date.getHours();
  const twelveHour = rawHours % 12 || 12;
  return {
    hours: String(twelveHour).padStart(2, "0"),
    minutes: String(date.getMinutes()).padStart(2, "0"),
    meridiem: rawHours >= 12 ? "pm" : "am",
  };
}

function createClockLine(className: string): HTMLSpanElement {
  const line = document.createElement("span");
  line.className = className;
  return line;
}

export function mountCogniflowClockPanel(host: HTMLElement): () => void {
  const panel = document.createElement("aside");
  panel.className = "cogniflow-clock-panel";
  panel.setAttribute("aria-label", "Current local time");

  const hours = createClockLine("cogniflow-clock-hours");
  const minutes = createClockLine("cogniflow-clock-minutes");
  const meridiem = createClockLine("cogniflow-clock-meridiem");

  panel.append(hours, minutes, meridiem);
  host.append(panel);

  const update = (): void => {
    const parts = clockParts(new Date());
    hours.textContent = parts.hours;
    minutes.textContent = parts.minutes;
    meridiem.textContent = parts.meridiem;
    panel.setAttribute(
      "aria-label",
      `Current local time ${parts.hours}:${parts.minutes} ${parts.meridiem.toUpperCase()}`,
    );
  };

  update();
  const interval = window.setInterval(update, 15_000);

  return () => {
    window.clearInterval(interval);
    panel.remove();
  };
}
