/** Generic local preview. Semantic selection lives in the compiler command, not here. */
import { startPresentation } from "./presentation-main.ts";

document.body.dataset.presentationTheme = new URLSearchParams(location.search).get("theme") === "light" ? "light" : "dark";
document.body.dataset.presentationClean = String(new URLSearchParams(location.search).get("clean") === "1");
const preview=new URLSearchParams(location.search).get("preview")??"authoring";
if(!/^authoring(?:-[a-z0-9]+)*$/u.test(preview))throw new Error("Invalid authoring preview name");
const response = await fetch(`./${preview}-runtime.json`);
if (!response.ok) throw new Error("Generate the local authoring transport before opening this preview");
await startPresentation(await response.json());
