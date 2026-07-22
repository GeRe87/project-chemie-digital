import type { PitchComponentDocument, PitchComponentPlan } from "./pitch-theme.ts";

export type PresenterModeDiagnosticCode =
  | "UNSUPPORTED_PRESENTER_CONFIG_VERSION"
  | "UNKNOWN_SECTION"
  | "UNKNOWN_COMPONENT"
  | "DUPLICATE_DETAIL_PATH"
  | "DUPLICATE_DETAIL_COMPONENT"
  | "CYCLIC_DETAIL_PATH"
  | "INVALID_DETAIL_PATH";

export interface PresenterModeDiagnostic {
  readonly code: PresenterModeDiagnosticCode;
  readonly message: string;
  readonly pathId?: string;
}

export interface PresenterDetailPathDefinition {
  readonly id: string;
  readonly label: string;
  readonly entryComponentId: string;
  readonly componentIds: readonly string[];
  readonly returnComponentId: string;
}

export interface PresenterModeConfiguration {
  readonly version: "1.0";
  readonly notesBySectionId?: Readonly<Record<string, string>>;
  readonly detailPaths: readonly PresenterDetailPathDefinition[];
}

export interface AudiencePresentationState {
  readonly sectionId: string;
  readonly componentId?: string;
  readonly staticFallback: string;
}

export interface PresenterNavigationState {
  readonly version: "1.0";
  readonly canonicalSectionIndex: number;
  readonly canonicalComponentId?: string;
  readonly activeDetailPathId?: string;
  readonly detailIndex?: number;
  readonly focusRestoreComponentId?: string;
  readonly elapsedSeconds: number;
  readonly reducedMotion: boolean;
}

export interface PresenterModeDocument {
  readonly version: "1.0";
  readonly sourceComponentDocumentId: string;
  readonly audience: AudiencePresentationState;
  readonly presenter: {
    readonly state: PresenterNavigationState;
    readonly currentNote?: string;
    readonly availableDetailPathIds: readonly string[];
  };
}

export interface PresenterModeResult {
  readonly document?: PresenterModeDocument;
  readonly diagnostics: readonly PresenterModeDiagnostic[];
}

export type PresenterAction =
  | { readonly type: "NEXT_SECTION" }
  | { readonly type: "PREVIOUS_SECTION" }
  | { readonly type: "ENTER_DETAIL"; readonly pathId: string }
  | { readonly type: "NEXT_DETAIL" }
  | { readonly type: "PREVIOUS_DETAIL" }
  | { readonly type: "EXIT_DETAIL" }
  | { readonly type: "TICK"; readonly seconds: number };

export interface PresenterRuntimePort {
  addKeydownListener(listener: (key: string) => void): () => void;
  startTimer(listener: () => void): () => void;
  focus(componentId: string): void;
  startTransition?(name: string): () => void;
}

export interface PresenterMountHandle {
  dispatch(action: PresenterAction): PresenterModeResult;
  getDocument(): PresenterModeDocument;
  destroy(): void;
}

class PresenterContractError extends Error {
  readonly code: PresenterModeDiagnosticCode;
  readonly pathId?: string;

  constructor(code: PresenterModeDiagnosticCode, message: string, pathId?: string) {
    super(message);
    this.code = code;
    this.pathId = pathId;
  }
}

function diagnostic(error: PresenterContractError): PresenterModeResult {
  return { diagnostics: [{ code: error.code, message: error.message, ...(error.pathId ? { pathId: error.pathId } : {}) }] };
}

function components(document: PitchComponentDocument): readonly PitchComponentPlan[] {
  return document.sections.flatMap((section) => section.components);
}

function validateConfiguration(document: PitchComponentDocument, configuration: PresenterModeConfiguration): void {
  if ((configuration as { version?: unknown }).version !== "1.0") {
    throw new PresenterContractError("UNSUPPORTED_PRESENTER_CONFIG_VERSION", "Unsupported presenter configuration version");
  }
  const sectionIds = new Set(document.sections.map((section) => section.id));
  for (const sectionId of Object.keys(configuration.notesBySectionId ?? {})) {
    if (!sectionIds.has(sectionId)) throw new PresenterContractError("UNKNOWN_SECTION", `Unknown presenter-note section ${sectionId}`);
  }
  const componentIds = new Set(components(document).map((component) => component.id));
  const pathIds = configuration.detailPaths.map((path) => path.id);
  if (new Set(pathIds).size !== pathIds.length) {
    throw new PresenterContractError("DUPLICATE_DETAIL_PATH", "Detail path ids must be unique");
  }
  for (const path of configuration.detailPaths) {
    if (path.componentIds.length === 0) throw new PresenterContractError("INVALID_DETAIL_PATH", "Detail path must contain at least one component", path.id);
    if (new Set(path.componentIds).size !== path.componentIds.length) {
      throw new PresenterContractError("DUPLICATE_DETAIL_COMPONENT", "Detail path component ids must be unique", path.id);
    }
    for (const id of [path.entryComponentId, ...path.componentIds, path.returnComponentId]) {
      if (!componentIds.has(id)) throw new PresenterContractError("UNKNOWN_COMPONENT", `Unknown component ${id}`, path.id);
    }
    if (path.componentIds.includes(path.returnComponentId)) {
      throw new PresenterContractError("CYCLIC_DETAIL_PATH", "Detail path cannot return to a component inside itself", path.id);
    }
  }
}

function fallbackFor(document: PitchComponentDocument, sectionIndex: number, componentId?: string): string {
  const section = document.sections[sectionIndex];
  if (!section) throw new PresenterContractError("UNKNOWN_SECTION", `Unknown section index ${sectionIndex}`);
  if (!componentId) return section.heading.staticFallback;
  const component = section.components.find((candidate) => candidate.id === componentId);
  if (!component) throw new PresenterContractError("UNKNOWN_COMPONENT", `Unknown component ${componentId}`);
  return component.staticFallback;
}

function currentComponentId(
  document: PitchComponentDocument,
  configuration: PresenterModeConfiguration,
  state: PresenterNavigationState,
): string | undefined {
  if (!state.activeDetailPathId) return state.canonicalComponentId;
  const path = configuration.detailPaths.find((candidate) => candidate.id === state.activeDetailPathId);
  if (!path) throw new PresenterContractError("INVALID_DETAIL_PATH", `Unknown active detail path ${state.activeDetailPathId}`);
  return path.componentIds[state.detailIndex ?? 0];
}

function createDocument(
  document: PitchComponentDocument,
  configuration: PresenterModeConfiguration,
  state: PresenterNavigationState,
): PresenterModeDocument {
  const section = document.sections[state.canonicalSectionIndex];
  if (!section) throw new PresenterContractError("UNKNOWN_SECTION", `Unknown section index ${state.canonicalSectionIndex}`);
  const componentId = currentComponentId(document, configuration, state);
  return {
    version: "1.0",
    sourceComponentDocumentId: document.sourceRenderPlanId,
    audience: {
      sectionId: section.id,
      ...(componentId ? { componentId } : {}),
      staticFallback: fallbackFor(document, state.canonicalSectionIndex, componentId),
    },
    presenter: {
      state,
      ...((configuration.notesBySectionId?.[section.id]) ? { currentNote: configuration.notesBySectionId[section.id] } : {}),
      availableDetailPathIds: configuration.detailPaths
        .filter((path) => section.components.some((component) => component.id === path.entryComponentId))
        .map((path) => path.id)
        .sort(),
    },
  };
}

export function createPresenterModeDocument(
  document: PitchComponentDocument,
  configuration: PresenterModeConfiguration,
): PresenterModeResult {
  try {
    validateConfiguration(document, configuration);
    const state: PresenterNavigationState = {
      version: "1.0",
      canonicalSectionIndex: 0,
      elapsedSeconds: 0,
      reducedMotion: document.sections.every((section) => section.components.every((component) => component.reducedMotion)),
    };
    return { document: createDocument(document, configuration, state), diagnostics: [] };
  } catch (error) {
    if (error instanceof PresenterContractError) return diagnostic(error);
    return diagnostic(new PresenterContractError("INVALID_DETAIL_PATH", error instanceof Error ? error.message : "Unknown presenter-mode failure"));
  }
}

export function reducePresenterState(
  document: PitchComponentDocument,
  configuration: PresenterModeConfiguration,
  state: PresenterNavigationState,
  action: PresenterAction,
): PresenterModeResult {
  try {
    validateConfiguration(document, configuration);
    let next: PresenterNavigationState = state;
    switch (action.type) {
      case "NEXT_SECTION":
        if (!state.activeDetailPathId) next = { ...state, canonicalSectionIndex: Math.min(state.canonicalSectionIndex + 1, document.sections.length - 1), canonicalComponentId: undefined };
        break;
      case "PREVIOUS_SECTION":
        if (!state.activeDetailPathId) next = { ...state, canonicalSectionIndex: Math.max(state.canonicalSectionIndex - 1, 0), canonicalComponentId: undefined };
        break;
      case "ENTER_DETAIL": { 
        if (state.activeDetailPathId) throw new PresenterContractError("CYCLIC_DETAIL_PATH", "Nested detail paths are not supported", action.pathId);
        const path = configuration.detailPaths.find((candidate) => candidate.id === action.pathId);
        if (!path) throw new PresenterContractError("INVALID_DETAIL_PATH", `Unknown detail path ${action.pathId}`, action.pathId);
        next = { ...state, activeDetailPathId: path.id, detailIndex: 0, focusRestoreComponentId: path.returnComponentId, canonicalComponentId: path.entryComponentId };
        break;
      }
      case "NEXT_DETAIL": {
        if (!state.activeDetailPathId) break;
        const path = configuration.detailPaths.find((candidate) => candidate.id === state.activeDetailPathId)!;
        next = { ...state, detailIndex: Math.min((state.detailIndex ?? 0) + 1, path.componentIds.length - 1) };
        break;
      }
      case "PREVIOUS_DETAIL":
        if (state.activeDetailPathId) next = { ...state, detailIndex: Math.max((state.detailIndex ?? 0) - 1, 0) };
        break;
      case "EXIT_DETAIL":
        if (state.activeDetailPathId) next = { ...state, activeDetailPathId: undefined, detailIndex: undefined, canonicalComponentId: state.focusRestoreComponentId, focusRestoreComponentId: undefined };
        break;
      case "TICK":
        if (!Number.isFinite(action.seconds) || action.seconds < 0) throw new PresenterContractError("INVALID_DETAIL_PATH", "Timer increment must be a non-negative finite number");
        next = { ...state, elapsedSeconds: state.elapsedSeconds + action.seconds };
        break;
    }
    return { document: createDocument(document, configuration, next), diagnostics: [] };
  } catch (error) {
    if (error instanceof PresenterContractError) return diagnostic(error);
    return diagnostic(new PresenterContractError("INVALID_DETAIL_PATH", error instanceof Error ? error.message : "Unknown presenter-mode failure"));
  }
}

export function canonicalSerializePresenterModeDocument(document: PresenterModeDocument): string {
  return JSON.stringify(document);
}

export function mountPresenterMode(
  componentDocument: PitchComponentDocument,
  configuration: PresenterModeConfiguration,
  runtime: PresenterRuntimePort,
): PresenterMountHandle {
  const initial = createPresenterModeDocument(componentDocument, configuration);
  if (!initial.document) throw new Error(initial.diagnostics[0]?.message ?? "Invalid presenter configuration");
  let current = initial.document;
  let destroyed = false;
  const cleanups: Array<() => void> = [];
  const apply = (action: PresenterAction): PresenterModeResult => {
    if (destroyed) return { diagnostics: [{ code: "INVALID_DETAIL_PATH", message: "Presenter mount is destroyed" }] };
    const result = reducePresenterState(componentDocument, configuration, current.presenter.state, action);
    if (result.document) {
      current = result.document;
      const focusId = current.presenter.state.activeDetailPathId
        ? current.audience.componentId
        : current.presenter.state.canonicalComponentId;
      if (focusId) runtime.focus(focusId);
    }
    return result;
  };
  cleanups.push(runtime.addKeydownListener((key) => {
    if (key === "PageDown") apply({ type: "NEXT_SECTION" });
    if (key === "PageUp") apply({ type: "PREVIOUS_SECTION" });
    if (key === "ArrowRight") apply({ type: "NEXT_DETAIL" });
    if (key === "ArrowLeft") apply({ type: "PREVIOUS_DETAIL" });
    if (key === "Escape") apply({ type: "EXIT_DETAIL" });
  }));
  cleanups.push(runtime.startTimer(() => { apply({ type: "TICK", seconds: 1 }); }));
  if (!current.presenter.state.reducedMotion) {
    const stop = runtime.startTransition?.("presenter-detail-transition");
    if (stop) cleanups.push(stop);
  }
  return {
    dispatch: apply,
    getDocument: () => current,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    },
  };
}
