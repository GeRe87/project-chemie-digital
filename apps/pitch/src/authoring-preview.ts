/** Generic local preview. Semantic selection lives in the compiler command, not here. */
import { startPresentation } from "./presentation-main.ts";

document.body.dataset.presentationTheme = new URLSearchParams(location.search).get("theme") === "light" ? "light" : "dark";
const response = await fetch("./authoring-runtime.json");
if (!response.ok) throw new Error("Generate the local authoring transport before opening this preview");
await startPresentation(await response.json());
