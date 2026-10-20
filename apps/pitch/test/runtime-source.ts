import { readFileSync } from "node:fs";

/** Architecture assertions cover both the lightweight entry and lazy runtime. */
export function presentationRuntimeSource():string {
  return ["../src/main.ts","../src/presentation-main.ts"]
    .map(path=>readFileSync(new URL(path,import.meta.url),"utf8").replace(/\r\n?/gu,"\n")).join("\n");
}
