export const SCENE_RESOURCE_BINDING_VERSION = "1.0" as const;
export const SCENE_GRAPH_PROJECTION_REQUEST_VERSION = "1.0" as const;
export const VIEW_SWITCH_STATE_VERSION = "1.0" as const;

export type SceneResourceBindingVersion = typeof SCENE_RESOURCE_BINDING_VERSION;
export type SceneGraphProjectionRequestVersion = typeof SCENE_GRAPH_PROJECTION_REQUEST_VERSION;
export type ViewSwitchStateVersion = typeof VIEW_SWITCH_STATE_VERSION;

export interface SceneResourceBinding {
  readonly version: SceneResourceBindingVersion;
  readonly blockId: string;
  readonly resourceIds: readonly string[];
  readonly provenanceResourceIds: readonly string[];
  readonly relationPath: readonly string[];
}

export interface DirectRelationAllowlist {
  readonly version: string;
  readonly relationIds: readonly string[];
}

export interface SceneGraphProjectionRequest {
  readonly version: SceneGraphProjectionRequestVersion;
  readonly sceneId: string;
  readonly sceneRevision: string;
  readonly bindings: readonly SceneResourceBinding[];
  readonly directRelationAllowlist: DirectRelationAllowlist;
  readonly language: string;
}

export type ViewMode = "presentation" | "graph" | "graph-summary";

export interface PresentationCursor {
  readonly blockId: string | null;
  readonly fragmentId: string | null;
}

export interface GraphCursor {
  readonly focusedResourceId: string | null;
  readonly expandedResourceIds: readonly string[];
  readonly visitedResourceIds: readonly string[];
}

export interface ReturnFocusIdentity {
  readonly controlId: string;
  readonly blockId: string | null;
}

export interface ViewSwitchState {
  readonly version: ViewSwitchStateVersion;
  readonly mode: ViewMode;
  readonly sceneId: string;
  readonly sceneRevision: string;
  readonly presentationCursor: PresentationCursor;
  readonly graphCursor: GraphCursor;
  readonly returnFocus: ReturnFocusIdentity;
}

export interface SceneRevisionSnapshot {
  readonly sceneId: string;
  readonly sceneRevision: string;
  readonly availableResourceIds: readonly string[];
  readonly availableBlockIds: readonly string[];
}

export interface ReconciledViewSwitchState {
  readonly state: ViewSwitchState;
  readonly revised: boolean;
  readonly discardedResourceIds: readonly string[];
}

export class SceneGraphViewContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneGraphViewContractError";
  }
}

const ABSOLUTE_IRI = /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$/;
const LANGUAGE_TAG = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

function lexicalCompare(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function requireNonEmpty(value: string, label: string): string {
  if (value.length === 0 || value.trim() !== value || /\s/.test(value)) {
    throw new SceneGraphViewContractError(`${label} must be a non-empty whitespace-free identity`);
  }
  return value;
}

function requireAbsoluteIri(value: string, label: string): string {
  requireNonEmpty(value, label);
  if (value.startsWith("_:") || !ABSOLUTE_IRI.test(value)) {
    throw new SceneGraphViewContractError(`${label} must be an absolute RDF IRI`);
  }
  return value;
}

function requireRevision(value: string, label: string): string {
  requireNonEmpty(value, label);
  return value;
}

function canonicalUnique(values: readonly string[], label: string, validator: (value: string, label: string) => string): readonly string[] {
  const validated = values.map((value, index) => validator(value, `${label}[${index}]`));
  if (new Set(validated).size !== validated.length) {
    throw new SceneGraphViewContractError(`${label} must not contain duplicate identities`);
  }
  return Object.freeze([...validated].sort(lexicalCompare));
}

function optionalIdentity(value: string | null, label: string): string | null {
  return value === null ? null : requireNonEmpty(value, label);
}

function optionalAbsoluteIri(value: string | null, label: string): string | null {
  return value === null ? null : requireAbsoluteIri(value, label);
}

export function canonicalizeSceneResourceBinding(binding: SceneResourceBinding): SceneResourceBinding {
  if (binding.version !== SCENE_RESOURCE_BINDING_VERSION) {
    throw new SceneGraphViewContractError(`Unsupported SceneResourceBinding version: ${binding.version}`);
  }
  const relationPath = binding.relationPath.map((value, index) => requireAbsoluteIri(value, `relationPath[${index}]`));
  return Object.freeze({
    version: SCENE_RESOURCE_BINDING_VERSION,
    blockId: requireNonEmpty(binding.blockId, "blockId"),
    resourceIds: canonicalUnique(binding.resourceIds, "resourceIds", requireAbsoluteIri),
    provenanceResourceIds: canonicalUnique(binding.provenanceResourceIds, "provenanceResourceIds", requireAbsoluteIri),
    relationPath: Object.freeze([...relationPath]),
  });
}

export function canonicalizeSceneResourceBindings(bindings: readonly SceneResourceBinding[]): readonly SceneResourceBinding[] {
  const canonical = bindings.map(canonicalizeSceneResourceBinding);
  const blockIds = canonical.map((binding) => binding.blockId);
  if (new Set(blockIds).size !== blockIds.length) {
    throw new SceneGraphViewContractError("bindings must not contain duplicate blockId values");
  }
  return Object.freeze([...canonical].sort((left, right) => lexicalCompare(left.blockId, right.blockId)));
}

export function canonicalizeSceneGraphProjectionRequest(request: SceneGraphProjectionRequest): SceneGraphProjectionRequest {
  if (request.version !== SCENE_GRAPH_PROJECTION_REQUEST_VERSION) {
    throw new SceneGraphViewContractError(`Unsupported SceneGraphProjectionRequest version: ${request.version}`);
  }
  if (!LANGUAGE_TAG.test(request.language)) {
    throw new SceneGraphViewContractError("language must be a valid language tag");
  }
  return Object.freeze({
    version: SCENE_GRAPH_PROJECTION_REQUEST_VERSION,
    sceneId: requireAbsoluteIri(request.sceneId, "sceneId"),
    sceneRevision: requireRevision(request.sceneRevision, "sceneRevision"),
    bindings: canonicalizeSceneResourceBindings(request.bindings),
    directRelationAllowlist: Object.freeze({
      version: requireRevision(request.directRelationAllowlist.version, "directRelationAllowlist.version"),
      relationIds: canonicalUnique(request.directRelationAllowlist.relationIds, "directRelationAllowlist.relationIds", requireAbsoluteIri),
    }),
    language: request.language.toLowerCase(),
  });
}

export function canonicalizeViewSwitchState(state: ViewSwitchState): ViewSwitchState {
  if (state.version !== VIEW_SWITCH_STATE_VERSION) {
    throw new SceneGraphViewContractError(`Unsupported ViewSwitchState version: ${state.version}`);
  }
  if (!( ["presentation", "graph", "graph-summary"] as readonly string[]).includes(state.mode)) {
    throw new SceneGraphViewContractError(`Unsupported view mode: ${state.mode}`);
  }
  return Object.freeze({
    version: VIEW_SWITCH_STATE_VERSION,
    mode: state.mode,
    sceneId: requireAbsoluteIri(state.sceneId, "sceneId"),
    sceneRevision: requireRevision(state.sceneRevision, "sceneRevision"),
    presentationCursor: Object.freeze({
      blockId: optionalIdentity(state.presentationCursor.blockId, "presentationCursor.blockId"),
      fragmentId: optionalIdentity(state.presentationCursor.fragmentId, "presentationCursor.fragmentId"),
    }),
    graphCursor: Object.freeze({
      focusedResourceId: optionalAbsoluteIri(state.graphCursor.focusedResourceId, "graphCursor.focusedResourceId"),
      expandedResourceIds: canonicalUnique(state.graphCursor.expandedResourceIds, "graphCursor.expandedResourceIds", requireAbsoluteIri),
      visitedResourceIds: canonicalUnique(state.graphCursor.visitedResourceIds, "graphCursor.visitedResourceIds", requireAbsoluteIri),
    }),
    returnFocus: Object.freeze({
      controlId: requireNonEmpty(state.returnFocus.controlId, "returnFocus.controlId"),
      blockId: optionalIdentity(state.returnFocus.blockId, "returnFocus.blockId"),
    }),
  });
}

export function reconcileViewSwitchState(state: ViewSwitchState, snapshot: SceneRevisionSnapshot): ReconciledViewSwitchState {
  const canonical = canonicalizeViewSwitchState(state);
  const sceneId = requireAbsoluteIri(snapshot.sceneId, "snapshot.sceneId");
  const sceneRevision = requireRevision(snapshot.sceneRevision, "snapshot.sceneRevision");
  if (canonical.sceneId !== sceneId) {
    throw new SceneGraphViewContractError("Cannot reconcile state from a different scene identity");
  }

  const availableResources = new Set(canonicalUnique(snapshot.availableResourceIds, "snapshot.availableResourceIds", requireAbsoluteIri));
  const availableBlocks = new Set(canonicalUnique(snapshot.availableBlockIds, "snapshot.availableBlockIds", requireNonEmpty));
  const referencedResources = Object.freeze(
    [...new Set([
      ...(canonical.graphCursor.focusedResourceId === null ? [] : [canonical.graphCursor.focusedResourceId]),
      ...canonical.graphCursor.expandedResourceIds,
      ...canonical.graphCursor.visitedResourceIds,
    ])].sort(lexicalCompare),
  );
  const referencedBlocks = Object.freeze(
    [...new Set([
      ...(canonical.presentationCursor.blockId === null ? [] : [canonical.presentationCursor.blockId]),
      ...(canonical.returnFocus.blockId === null ? [] : [canonical.returnFocus.blockId]),
    ])].sort(lexicalCompare),
  );

  if (canonical.sceneRevision === sceneRevision) {
    const missingResourceId = referencedResources.find((identity) => !availableResources.has(identity));
    if (missingResourceId !== undefined) {
      throw new SceneGraphViewContractError(`Same-revision snapshot is missing referenced resource identity: ${missingResourceId}`);
    }
    const missingBlockId = referencedBlocks.find((identity) => !availableBlocks.has(identity));
    if (missingBlockId !== undefined) {
      throw new SceneGraphViewContractError(`Same-revision snapshot is missing referenced block identity: ${missingBlockId}`);
    }
    return Object.freeze({ state: canonical, revised: false, discardedResourceIds: Object.freeze([]) });
  }

  const discardedResourceIds = Object.freeze(
    referencedResources.filter((identity) => !availableResources.has(identity)),
  );
  const presentationBlockId = canonical.presentationCursor.blockId !== null && availableBlocks.has(canonical.presentationCursor.blockId)
    ? canonical.presentationCursor.blockId
    : null;
  const reconciled = canonicalizeViewSwitchState({
    ...canonical,
    sceneRevision,
    presentationCursor: {
      blockId: presentationBlockId,
      fragmentId: presentationBlockId === null ? null : canonical.presentationCursor.fragmentId,
    },
    graphCursor: {
      focusedResourceId: canonical.graphCursor.focusedResourceId !== null && availableResources.has(canonical.graphCursor.focusedResourceId)
        ? canonical.graphCursor.focusedResourceId
        : null,
      expandedResourceIds: canonical.graphCursor.expandedResourceIds.filter((identity) => availableResources.has(identity)),
      visitedResourceIds: canonical.graphCursor.visitedResourceIds.filter((identity) => availableResources.has(identity)),
    },
    returnFocus: {
      controlId: canonical.returnFocus.controlId,
      blockId: canonical.returnFocus.blockId !== null && availableBlocks.has(canonical.returnFocus.blockId)
        ? canonical.returnFocus.blockId
        : null,
    },
  });
  return Object.freeze({ state: reconciled, revised: true, discardedResourceIds });
}

export function canonicalSerializeSceneGraphProjectionRequest(request: SceneGraphProjectionRequest): string {
  return JSON.stringify(canonicalizeSceneGraphProjectionRequest(request));
}

export function canonicalSerializeViewSwitchState(state: ViewSwitchState): string {
  return JSON.stringify(canonicalizeViewSwitchState(state));
}
