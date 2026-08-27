export const LEARNER_STATE_DOCUMENT_VERSION = "1.0" as const;

export type LearnerPromptResponseMode = "reflection" | "single-choice" | "multiple-choice" | "free-text";
export type LearnerDisclosureMode = "optional" | "progressive";

export type LearnerPromptResponse =
  | { readonly sceneId: string; readonly blockId: string; readonly responseMode: "reflection" | "free-text"; readonly value: string }
  | { readonly sceneId: string; readonly blockId: string; readonly responseMode: "single-choice"; readonly value: string }
  | { readonly sceneId: string; readonly blockId: string; readonly responseMode: "multiple-choice"; readonly value: readonly string[] };

export interface LearnerDisclosureState {
  readonly sceneId: string;
  readonly blockId: string;
  readonly mode: LearnerDisclosureMode;
  readonly open: boolean;
  readonly visible: boolean;
}

export interface LearnerDocumentState {
  readonly documentId: string;
  readonly promptResponses: readonly LearnerPromptResponse[];
  readonly disclosures: readonly LearnerDisclosureState[];
}

export interface LearnerStateDocument {
  readonly version: typeof LEARNER_STATE_DOCUMENT_VERSION;
  readonly datasetFingerprint: string;
  readonly documents: readonly LearnerDocumentState[];
}

export interface LearnerStateRuntimeBlock {
  readonly sceneId: string;
  readonly blockId: string;
  readonly prompt?: {
    readonly responseMode: LearnerPromptResponseMode;
    readonly options?: readonly string[];
  };
  readonly disclosure?: {
    readonly mode: LearnerDisclosureMode;
  };
}

export interface LearnerStateRuntimeDocument {
  readonly documentId: string;
  readonly sceneIds: readonly string[];
  readonly blocks: readonly LearnerStateRuntimeBlock[];
}

export interface LearnerStateRuntime {
  readonly datasetFingerprint: string;
  readonly documents: readonly LearnerStateRuntimeDocument[];
}

export type LearnerStateDiagnosticCode =
  | "MALFORMED_DOCUMENT"
  | "UNSUPPORTED_VERSION"
  | "DATASET_FINGERPRINT_MISMATCH"
  | "UNKNOWN_DOCUMENT"
  | "UNKNOWN_SCENE"
  | "UNKNOWN_BLOCK"
  | "INVALID_STATE_OWNER"
  | "RESPONSE_MODE_MISMATCH"
  | "INVALID_CHOICE_VALUE"
  | "DISCLOSURE_MODE_MISMATCH"
  | "DUPLICATE_STATE";

export interface LearnerStateDiagnostic {
  readonly code: LearnerStateDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface LearnerStateResult {
  readonly document?: LearnerStateDocument;
  readonly diagnostics: readonly LearnerStateDiagnostic[];
}

function compareString(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareIdentity(
  left: { readonly sceneId: string; readonly blockId: string },
  right: { readonly sceneId: string; readonly blockId: string },
): number {
  return compareString(left.sceneId, right.sceneId) || compareString(left.blockId, right.blockId);
}

function normalizePromptResponse(response: LearnerPromptResponse): LearnerPromptResponse {
  if (response.responseMode === "multiple-choice") {
    return {
      sceneId: response.sceneId,
      blockId: response.blockId,
      responseMode: response.responseMode,
      value: [...response.value].sort(compareString),
    };
  }
  return {
    sceneId: response.sceneId,
    blockId: response.blockId,
    responseMode: response.responseMode,
    value: response.value,
  };
}

function normalizeDocumentState(state: LearnerDocumentState): LearnerDocumentState {
  return {
    documentId: state.documentId,
    promptResponses: state.promptResponses.map(normalizePromptResponse).sort(compareIdentity),
    disclosures: state.disclosures.map((item) => ({
      sceneId: item.sceneId,
      blockId: item.blockId,
      mode: item.mode,
      open: item.open,
      visible: item.visible,
    })).sort(compareIdentity),
  };
}

export function createLearnerStateDocument(
  datasetFingerprint: string,
  documents: readonly LearnerDocumentState[],
): LearnerStateDocument {
  return {
    version: LEARNER_STATE_DOCUMENT_VERSION,
    datasetFingerprint,
    documents: documents.map(normalizeDocumentState).sort((left, right) => compareString(left.documentId, right.documentId)),
  };
}

export function emptyLearnerDocumentState(documentId: string): LearnerDocumentState {
  return { documentId, promptResponses: [], disclosures: [] };
}

export function canonicalSerializeLearnerStateDocument(document: LearnerStateDocument): string {
  return `${JSON.stringify(createLearnerStateDocument(document.datasetFingerprint, document.documents), null, 2)}\n`;
}

function diagnostic(code: LearnerStateDiagnosticCode, path: string, message: string): LearnerStateDiagnostic {
  return { code, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): LearnerStateDiagnostic | undefined {
  const allowedSet = new Set(allowed);
  const unexpected = Object.keys(value).find((key) => !allowedSet.has(key));
  return unexpected ? diagnostic("MALFORMED_DOCUMENT", `${path}.${unexpected}`, `Unexpected field ${unexpected}`) : undefined;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function parsePromptResponse(value: unknown, path: string): { value?: LearnerPromptResponse; diagnostic?: LearnerStateDiagnostic } {
  if (!isRecord(value)) return { diagnostic: diagnostic("MALFORMED_DOCUMENT", path, "Prompt response must be an object") };
  const keysError = exactKeys(value, ["sceneId", "blockId", "responseMode", "value"], path);
  if (keysError) return { diagnostic: keysError };
  if (!nonEmptyString(value.sceneId) || !nonEmptyString(value.blockId)) {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", path, "Prompt response requires non-empty sceneId and blockId") };
  }
  if (!["reflection", "single-choice", "multiple-choice", "free-text"].includes(String(value.responseMode))) {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", `${path}.responseMode`, "Unsupported prompt response mode") };
  }
  const responseMode = value.responseMode as LearnerPromptResponseMode;
  if (responseMode === "multiple-choice") {
    if (!Array.isArray(value.value) || value.value.some((item) => typeof item !== "string")) {
      return { diagnostic: diagnostic("MALFORMED_DOCUMENT", `${path}.value`, "Multiple-choice value must be a string array") };
    }
    const values = value.value as string[];
    if (new Set(values).size !== values.length) {
      return { diagnostic: diagnostic("DUPLICATE_STATE", `${path}.value`, "Multiple-choice values must be unique") };
    }
    return { value: { sceneId: value.sceneId, blockId: value.blockId, responseMode, value: values } };
  }
  if (typeof value.value !== "string") {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", `${path}.value`, "Prompt response value must be a string") };
  }
  if (responseMode === "single-choice") {
    return { value: { sceneId: value.sceneId, blockId: value.blockId, responseMode, value: value.value } };
  }
  return { value: { sceneId: value.sceneId, blockId: value.blockId, responseMode, value: value.value } };
}

function parseDisclosure(value: unknown, path: string): { value?: LearnerDisclosureState; diagnostic?: LearnerStateDiagnostic } {
  if (!isRecord(value)) return { diagnostic: diagnostic("MALFORMED_DOCUMENT", path, "Disclosure state must be an object") };
  const keysError = exactKeys(value, ["sceneId", "blockId", "mode", "open", "visible"], path);
  if (keysError) return { diagnostic: keysError };
  if (!nonEmptyString(value.sceneId) || !nonEmptyString(value.blockId)) {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", path, "Disclosure state requires non-empty sceneId and blockId") };
  }
  if (value.mode !== "optional" && value.mode !== "progressive") {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", `${path}.mode`, "Disclosure mode must be optional or progressive") };
  }
  if (typeof value.open !== "boolean" || typeof value.visible !== "boolean") {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", path, "Disclosure open and visible fields must be boolean") };
  }
  if (value.mode === "optional" && !value.visible) {
    return { diagnostic: diagnostic("MALFORMED_DOCUMENT", `${path}.visible`, "Optional disclosure cannot be hidden") };
  }
  return { value: { sceneId: value.sceneId, blockId: value.blockId, mode: value.mode, open: value.open, visible: value.visible } };
}

function parseDocumentState(value: unknown, path: string): { value?: LearnerDocumentState; diagnostics: LearnerStateDiagnostic[] } {
  const diagnostics: LearnerStateDiagnostic[] = [];
  if (!isRecord(value)) return { diagnostics: [diagnostic("MALFORMED_DOCUMENT", path, "Document state must be an object")] };
  const keysError = exactKeys(value, ["documentId", "promptResponses", "disclosures"], path);
  if (keysError) return { diagnostics: [keysError] };
  if (!nonEmptyString(value.documentId) || !Array.isArray(value.promptResponses) || !Array.isArray(value.disclosures)) {
    return { diagnostics: [diagnostic("MALFORMED_DOCUMENT", path, "Document state has an invalid shape")] };
  }

  const promptResponses: LearnerPromptResponse[] = [];
  for (const [index, item] of value.promptResponses.entries()) {
    const parsed = parsePromptResponse(item, `${path}.promptResponses[${index}]`);
    if (parsed.diagnostic) diagnostics.push(parsed.diagnostic);
    else if (parsed.value) promptResponses.push(parsed.value);
  }
  const disclosures: LearnerDisclosureState[] = [];
  for (const [index, item] of value.disclosures.entries()) {
    const parsed = parseDisclosure(item, `${path}.disclosures[${index}]`);
    if (parsed.diagnostic) diagnostics.push(parsed.diagnostic);
    else if (parsed.value) disclosures.push(parsed.value);
  }

  const promptKeys = promptResponses.map((item) => `${item.sceneId}\u0000${item.blockId}`);
  if (new Set(promptKeys).size !== promptKeys.length) diagnostics.push(diagnostic("DUPLICATE_STATE", `${path}.promptResponses`, "Duplicate prompt response record"));
  const disclosureKeys = disclosures.map((item) => `${item.sceneId}\u0000${item.blockId}`);
  if (new Set(disclosureKeys).size !== disclosureKeys.length) diagnostics.push(diagnostic("DUPLICATE_STATE", `${path}.disclosures`, "Duplicate disclosure state record"));

  return diagnostics.length > 0
    ? { diagnostics }
    : { value: { documentId: value.documentId, promptResponses, disclosures }, diagnostics };
}

export function parseLearnerStateDocument(source: string): LearnerStateResult {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return { diagnostics: [diagnostic("MALFORMED_DOCUMENT", "$", "Learner-state artifact is not valid JSON")] };
  }
  if (!isRecord(value)) return { diagnostics: [diagnostic("MALFORMED_DOCUMENT", "$", "Learner-state artifact must be an object")] };
  const keysError = exactKeys(value, ["version", "datasetFingerprint", "documents"], "$");
  if (keysError) return { diagnostics: [keysError] };
  if (value.version !== LEARNER_STATE_DOCUMENT_VERSION) {
    return { diagnostics: [diagnostic("UNSUPPORTED_VERSION", "$.version", `Unsupported learner-state version: ${String(value.version)}`)] };
  }
  if (!nonEmptyString(value.datasetFingerprint) || !value.datasetFingerprint.startsWith("sha256:") || !Array.isArray(value.documents)) {
    return { diagnostics: [diagnostic("MALFORMED_DOCUMENT", "$", "Learner-state artifact has an invalid root shape")] };
  }

  const diagnostics: LearnerStateDiagnostic[] = [];
  const documents: LearnerDocumentState[] = [];
  for (const [index, item] of value.documents.entries()) {
    const parsed = parseDocumentState(item, `$.documents[${index}]`);
    diagnostics.push(...parsed.diagnostics);
    if (parsed.value) documents.push(parsed.value);
  }
  const documentIds = documents.map((item) => item.documentId);
  if (new Set(documentIds).size !== documentIds.length) diagnostics.push(diagnostic("DUPLICATE_STATE", "$.documents", "Duplicate document state record"));
  if (diagnostics.length > 0) return { diagnostics };
  return { document: createLearnerStateDocument(value.datasetFingerprint, documents), diagnostics: [] };
}

function runtimeDocumentMap(runtime: LearnerStateRuntime): Map<string, LearnerStateRuntimeDocument> {
  return new Map(runtime.documents.map((documentValue) => [documentValue.documentId, documentValue]));
}

function runtimeBlock(
  documentValue: LearnerStateRuntimeDocument,
  sceneId: string,
  blockId: string,
): LearnerStateRuntimeBlock | undefined {
  return documentValue.blocks.find((block) => block.sceneId === sceneId && block.blockId === blockId);
}

export function validateLearnerStateDocument(document: LearnerStateDocument, runtime: LearnerStateRuntime): LearnerStateResult {
  const diagnostics: LearnerStateDiagnostic[] = [];
  if (document.version !== LEARNER_STATE_DOCUMENT_VERSION) {
    diagnostics.push(diagnostic("UNSUPPORTED_VERSION", "$.version", `Unsupported learner-state version: ${String(document.version)}`));
    return { diagnostics };
  }
  if (document.datasetFingerprint !== runtime.datasetFingerprint) {
    diagnostics.push(diagnostic("DATASET_FINGERPRINT_MISMATCH", "$.datasetFingerprint", "Learner-state dataset fingerprint does not match active runtime"));
    return { diagnostics };
  }

  const documents = runtimeDocumentMap(runtime);
  for (const [documentIndex, state] of document.documents.entries()) {
    const runtimeDocument = documents.get(state.documentId);
    const documentPath = `$.documents[${documentIndex}]`;
    if (!runtimeDocument) {
      diagnostics.push(diagnostic("UNKNOWN_DOCUMENT", `${documentPath}.documentId`, `Unknown source document ${state.documentId}`));
      continue;
    }
    const sceneIds = new Set(runtimeDocument.sceneIds);

    for (const [responseIndex, response] of state.promptResponses.entries()) {
      const path = `${documentPath}.promptResponses[${responseIndex}]`;
      if (!sceneIds.has(response.sceneId)) {
        diagnostics.push(diagnostic("UNKNOWN_SCENE", `${path}.sceneId`, `Unknown source scene ${response.sceneId}`));
        continue;
      }
      const block = runtimeBlock(runtimeDocument, response.sceneId, response.blockId);
      if (!block) {
        diagnostics.push(diagnostic("UNKNOWN_BLOCK", `${path}.blockId`, `Unknown source block ${response.blockId}`));
        continue;
      }
      if (!block.prompt) {
        diagnostics.push(diagnostic("INVALID_STATE_OWNER", path, `Block ${response.blockId} cannot own a prompt response`));
        continue;
      }
      if (block.prompt.responseMode !== response.responseMode) {
        diagnostics.push(diagnostic("RESPONSE_MODE_MISMATCH", `${path}.responseMode`, `Prompt response mode does not match active block ${response.blockId}`));
        continue;
      }
      if (response.responseMode === "single-choice") {
        if (!(block.prompt.options ?? []).includes(response.value)) {
          diagnostics.push(diagnostic("INVALID_CHOICE_VALUE", `${path}.value`, `Single-choice value is not an authored option for ${response.blockId}`));
        }
      } else if (response.responseMode === "multiple-choice") {
        const authored = new Set(block.prompt.options ?? []);
        if (response.value.some((item) => !authored.has(item))) {
          diagnostics.push(diagnostic("INVALID_CHOICE_VALUE", `${path}.value`, `Multiple-choice value contains an unauthored option for ${response.blockId}`));
        }
      }
    }

    for (const [disclosureIndex, disclosure] of state.disclosures.entries()) {
      const path = `${documentPath}.disclosures[${disclosureIndex}]`;
      if (!sceneIds.has(disclosure.sceneId)) {
        diagnostics.push(diagnostic("UNKNOWN_SCENE", `${path}.sceneId`, `Unknown source scene ${disclosure.sceneId}`));
        continue;
      }
      const block = runtimeBlock(runtimeDocument, disclosure.sceneId, disclosure.blockId);
      if (!block) {
        diagnostics.push(diagnostic("UNKNOWN_BLOCK", `${path}.blockId`, `Unknown source block ${disclosure.blockId}`));
        continue;
      }
      if (!block.disclosure) {
        diagnostics.push(diagnostic("INVALID_STATE_OWNER", path, `Block ${disclosure.blockId} cannot own disclosure state`));
        continue;
      }
      if (block.disclosure.mode !== disclosure.mode) {
        diagnostics.push(diagnostic("DISCLOSURE_MODE_MISMATCH", `${path}.mode`, `Disclosure mode does not match active block ${disclosure.blockId}`));
      }
    }
  }

  return diagnostics.length > 0 ? { diagnostics } : { document: createLearnerStateDocument(document.datasetFingerprint, document.documents), diagnostics: [] };
}

export function parseAndValidateLearnerStateDocument(source: string, runtime: LearnerStateRuntime): LearnerStateResult {
  const parsed = parseLearnerStateDocument(source);
  if (!parsed.document) return parsed;
  return validateLearnerStateDocument(parsed.document, runtime);
}
