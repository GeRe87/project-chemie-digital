import type { BackgroundPack } from "../../../packages/renderer-reveal/src/background/background-pack.ts";

export type PresentationView = "scroll" | "deck";

export interface PresentationProfile {
  readonly id: string;
  readonly label: string;
  readonly defaultView: PresentationView;
  readonly defaultBackgroundPackId?: string;
}

export interface ResolvedPresentationAppearance {
  readonly profile: PresentationProfile;
  readonly view: PresentationView;
  readonly backgroundPackId?: string;
  readonly diagnostics: readonly string[];
}

export const chemometricsNeonCityPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: "chemometrics-neon-city",
  label: "Chemometrics Neon City",
  baseColor: "#07101f",
  layers: Object.freeze([
    Object.freeze({ id: "bg-skyline", asset: "/presentation-backgrounds/chemometrics-neon-city/bg-skyline.webp", speed: 0.08, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-left", asset: "/presentation-backgrounds/chemometrics-neon-city/facade-left.webp", speed: 0.22, anchor: "left", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-right", asset: "/presentation-backgrounds/chemometrics-neon-city/facade-right.webp", speed: 0.27, anchor: "right", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "bridges", asset: "/presentation-backgrounds/chemometrics-neon-city/bridges.webp", speed: 0.44, anchor: "center", repeat: "y", opacity: 0.55, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "rain-fog", asset: "/presentation-backgrounds/chemometrics-neon-city/rain-fog.webp", speed: 0.72, anchor: "center", repeat: "y", opacity: 0.18, blendMode: "screen", sizing: "cover-width" }),
  ]),
});

export const backgroundPackRegistry: readonly BackgroundPack[] = Object.freeze([chemometricsNeonCityPack]);

export const chemometricsPresentationProfile: PresentationProfile = Object.freeze({
  id: "chemometrics",
  label: "Chemometrics and Applied Statistics",
  defaultView: "scroll",
  defaultBackgroundPackId: chemometricsNeonCityPack.id,
});

export function resolvePresentationAppearance(search: string): ResolvedPresentationAppearance {
  const params = new URLSearchParams(search);
  const diagnostics: string[] = [];
  const profile = chemometricsPresentationProfile;
  const requestedView = params.get("view");
  const view: PresentationView = requestedView === "deck" || requestedView === "scroll" ? requestedView : profile.defaultView;
  if (requestedView && requestedView !== "deck" && requestedView !== "scroll") diagnostics.push(`Unsupported view '${requestedView}', using '${view}'.`);

  const requestedBackground = params.get("background");
  let backgroundPackId: string | undefined = profile.defaultBackgroundPackId;
  if (requestedBackground === "none") backgroundPackId = undefined;
  else if (requestedBackground) {
    if (backgroundPackRegistry.some((pack) => pack.id === requestedBackground)) backgroundPackId = requestedBackground;
    else diagnostics.push(`Unknown background '${requestedBackground}', using the profile default.`);
  }

  return Object.freeze({ profile, view, ...(backgroundPackId ? { backgroundPackId } : {}), diagnostics: Object.freeze(diagnostics) });
}

export interface AppearanceControlHandle { destroy(): void; }

export function mountAppearanceControls(options: {
  readonly root: HTMLElement;
  readonly currentPackId?: string;
  readonly onBackgroundChange: (packId: string | undefined) => void;
}): AppearanceControlHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "appearance-controls";
  const label = document.createElement("label");
  label.htmlFor = "presentation-background-select";
  label.textContent = "Background";
  const select = document.createElement("select");
  select.id = "presentation-background-select";
  select.setAttribute("aria-label", "Presentation background");
  const none = document.createElement("option");
  none.value = "none";
  none.textContent = "None";
  select.append(none);
  for (const pack of backgroundPackRegistry) {
    const option = document.createElement("option");
    option.value = pack.id;
    option.textContent = pack.label;
    select.append(option);
  }
  select.value = options.currentPackId ?? "none";
  const hint = document.createElement("span");
  hint.className = "appearance-controls-hint";
  hint.textContent = "Alt+B toggles";
  const apply = () => options.onBackgroundChange(select.value === "none" ? undefined : select.value);
  const toggle = (event: KeyboardEvent) => {
    if (!event.altKey || event.key.toLowerCase() !== "b") return;
    event.preventDefault();
    select.value = select.value === "none" ? (backgroundPackRegistry[0]?.id ?? "none") : "none";
    apply();
  };
  select.addEventListener("change", apply);
  window.addEventListener("keydown", toggle);
  wrapper.append(label, select, hint);
  options.root.prepend(wrapper);
  return { destroy() { select.removeEventListener("change", apply); window.removeEventListener("keydown", toggle); wrapper.remove(); } };
}
