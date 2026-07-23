import {
  conceptDocument,
  resourceDocument,
  sceneDocument,
} from "./generated/standard-deviation-scene-data.ts";
import { compileGraphBackedScene } from "../../../packages/core/src/graph-scene-compiler.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";

export const STANDARD_DEVIATION_SCENE_ID = "ex:standard-deviation-definition-with-citation-scene";

export function compilePitchSceneDocuments(): readonly SceneDocument[] {
  const result = compileGraphBackedScene({ conceptDocument, resourceDocument, sceneDocument }, STANDARD_DEVIATION_SCENE_ID);
  if (!result.document) {
    const diagnostic = result.diagnostics[0];
    throw new Error(`Scene compilation failed: ${diagnostic?.code ?? "UNKNOWN"} ${diagnostic?.rule ?? ""}`.trim());
  }
  return [result.document];
}
