export interface PollAggregateOption {
  readonly id: string;
  readonly count: number;
}

export interface PollAggregate {
  readonly pollKey: string;
  readonly participationUrl: string;
  readonly qrCodeUrl?: string;
  readonly total: number;
  readonly options: readonly PollAggregateOption[];
}

export interface LiveResponseProvider {
  load(pollKey: string, expectedOptionIds: readonly string[], signal: AbortSignal): Promise<PollAggregate>;
}

export interface PollRuntimeController {
  refresh(): Promise<void>;
  destroy(): void;
}

export function pollServiceBase(search: string): string {
  const configured = new URLSearchParams(search).get("pollEndpoint")?.trim();
  return (configured || "http://127.0.0.1:8787").replace(/\/$/, "");
}

export function parsePollAggregate(
  value: unknown,
  expectedPollKey: string,
  expectedOptionIds: readonly string[],
): PollAggregate {
  if (!value || typeof value !== "object") throw new Error("Poll service returned no JSON object");
  const candidate = value as Record<string, unknown>;
  if (candidate.pollKey !== expectedPollKey) throw new Error("Poll service returned a different poll key");
  if (typeof candidate.participationUrl !== "string" || candidate.participationUrl.length === 0) {
    throw new Error("Poll service returned no participation URL");
  }
  if (!Number.isInteger(candidate.total) || Number(candidate.total) < 0) throw new Error("Poll service returned an invalid total");
  if (!Array.isArray(candidate.options)) throw new Error("Poll service returned no options");
  if (expectedOptionIds.length < 2 || new Set(expectedOptionIds).size !== expectedOptionIds.length) {
    throw new Error("Authored poll option identities are invalid");
  }
  const byId = new Map<string, PollAggregateOption>();
  for (const option of candidate.options) {
    if (!option || typeof option !== "object") throw new Error("Poll service returned an invalid option");
    const item = option as Record<string, unknown>;
    if (typeof item.id !== "string" || !item.id) throw new Error("Poll option id is missing");
    if (!Number.isInteger(item.count) || Number(item.count) < 0) throw new Error("Poll option count is invalid");
    if (byId.has(item.id)) throw new Error(`Poll service duplicated option ${item.id}`);
    byId.set(item.id, { id: item.id, count: Number(item.count) });
  }
  const expected = new Set(expectedOptionIds);
  if (byId.size !== expected.size || [...byId.keys()].some((id) => !expected.has(id))) {
    throw new Error("Poll service option identities do not match the authored poll");
  }
  const options = expectedOptionIds.map((id) => byId.get(id)!);
  const counted = options.reduce((sum, option) => sum + option.count, 0);
  if (counted !== Number(candidate.total)) throw new Error("Poll option counts do not match total");
  return {
    pollKey: expectedPollKey,
    participationUrl: candidate.participationUrl,
    ...(typeof candidate.qrCodeUrl === "string" && candidate.qrCodeUrl ? { qrCodeUrl: candidate.qrCodeUrl } : {}),
    total: Number(candidate.total),
    options,
  };
}

export function createHttpLiveResponseProvider(
  search: string,
  request: typeof fetch = fetch,
): LiveResponseProvider {
  const serviceBase = pollServiceBase(search);
  return {
    async load(pollKey: string, expectedOptionIds: readonly string[], signal: AbortSignal): Promise<PollAggregate> {
      const response = await request(`${serviceBase}/polls/${encodeURIComponent(pollKey)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error(`Poll service HTTP ${response.status}`);
      return parsePollAggregate(await response.json(), pollKey, expectedOptionIds);
    },
  };
}

function authoredOptionLabels(shell: HTMLElement): ReadonlyMap<string, string> {
  const optionIds = (shell.dataset.pollOptionIds ?? "").split(/\s+/).filter(Boolean);
  const labels = [...shell.querySelectorAll<HTMLElement>(".poll-options li")]
    .map((item) => item.textContent?.trim() ?? "")
    .filter(Boolean);
  if (optionIds.length < 2 || optionIds.length !== labels.length || new Set(optionIds).size !== optionIds.length) {
    throw new Error("Graph-backed poll options are incomplete");
  }
  return new Map(optionIds.map((id, index) => [id, labels[index]!]));
}

function renderAggregate(host: HTMLElement, aggregate: PollAggregate, labels: ReadonlyMap<string, string>): void {
  host.innerHTML = "";
  const participation = document.createElement("div");
  participation.className = "poll-participation";
  const link = document.createElement("a");
  link.href = aggregate.participationUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "An Umfrage teilnehmen";
  participation.appendChild(link);
  if (aggregate.qrCodeUrl) {
    const qr = document.createElement("img");
    qr.className = "poll-qr";
    qr.src = aggregate.qrCodeUrl;
    qr.alt = "QR-Code zur Umfrage";
    participation.appendChild(qr);
  }

  const summary = document.createElement("p");
  summary.className = "poll-summary";
  summary.textContent = `${aggregate.total} Antwort${aggregate.total === 1 ? "" : "en"}`;

  const results = document.createElement("div");
  results.className = "poll-results";
  results.setAttribute("role", "list");
  for (const option of aggregate.options) {
    const optionLabel = labels.get(option.id);
    if (!optionLabel) throw new Error(`Missing graph-backed label for poll option ${option.id}`);
    const percentage = aggregate.total === 0 ? 0 : Math.round((option.count / aggregate.total) * 100);
    const row = document.createElement("div");
    row.className = "poll-result";
    row.setAttribute("role", "listitem");
    const label = document.createElement("div");
    label.className = "poll-result-label";
    label.textContent = `${optionLabel}: ${option.count} (${percentage} %)`;
    const track = document.createElement("div");
    track.className = "poll-result-track";
    track.setAttribute("aria-hidden", "true");
    const bar = document.createElement("div");
    bar.className = "poll-result-bar";
    bar.style.width = `${percentage}%`;
    track.appendChild(bar);
    row.append(label, track);
    results.appendChild(row);
  }
  host.append(participation, summary, results);
}

export function mountLivePolls(
  root: ParentNode,
  search: string,
  provider: LiveResponseProvider = createHttpLiveResponseProvider(search),
): PollRuntimeController {
  const shells = [...root.querySelectorAll<HTMLElement>('.live-poll[data-poll-key]')];
  if (shells.length === 0) return { refresh: async () => undefined, destroy: () => undefined };
  const cleanup: Array<() => void> = [];
  const refreshers: Array<() => Promise<void>> = [];

  for (const shell of shells) {
    const pollKey = shell.dataset.pollKey;
    if (!pollKey) continue;
    const optionLabels = authoredOptionLabels(shell);
    const optionIds = [...optionLabels.keys()];
    const host = document.createElement("div");
    host.className = "poll-live-results";
    host.setAttribute("aria-live", "polite");
    const status = document.createElement("p");
    status.className = "poll-status";
    status.textContent = "Live-Ergebnisse werden geladen …";
    host.appendChild(status);
    shell.appendChild(host);

    let destroyed = false;
    let request: AbortController | undefined;
    const stopDeckKeyboard = (event: KeyboardEvent): void => event.stopPropagation();
    shell.addEventListener("keydown", stopDeckKeyboard);
    const refresh = async (): Promise<void> => {
      if (destroyed) return;
      request?.abort();
      request = new AbortController();
      try {
        const aggregate = await provider.load(pollKey, optionIds, request.signal);
        if (!destroyed) renderAggregate(host, aggregate, optionLabels);
      } catch (error) {
        if (destroyed || (error instanceof DOMException && error.name === "AbortError")) return;
        host.innerHTML = "";
        const message = document.createElement("p");
        message.className = "poll-status poll-status-error";
        message.textContent = `Live-Ergebnisse nicht verfügbar: ${error instanceof Error ? error.message : String(error)}`;
        host.appendChild(message);
      }
    };
    refreshers.push(refresh);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    cleanup.push(() => {
      destroyed = true;
      window.clearInterval(timer);
      request?.abort();
      shell.removeEventListener("keydown", stopDeckKeyboard);
      host.remove();
    });
  }

  let destroyed = false;
  return {
    async refresh(): Promise<void> {
      if (!destroyed) await Promise.all(refreshers.map((refresh) => refresh()));
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      for (const remove of cleanup.reverse()) remove();
    },
  };
}
