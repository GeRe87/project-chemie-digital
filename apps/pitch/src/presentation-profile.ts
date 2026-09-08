import type { BackgroundPack } from "../../../packages/renderer-reveal/src/background/background-pack.ts";

export type PresentationView = "scroll" | "deck";
export type PresentationTheme = "dark" | "light";

export interface PresentationProfile {
  readonly id: string;
  readonly label: string;
  readonly defaultView: PresentationView;
  readonly defaultBackgroundPackId?: string;
}

export interface ResolvedPresentationAppearance {
  readonly profile: PresentationProfile;
  readonly view: PresentationView;
  readonly theme: PresentationTheme;
  readonly backgroundPackId?: string;
  readonly diagnostics: readonly string[];
}

export const CHEMOMETRICS_SOURCE_PATH_ID = "ex:path-chemometrics-mean-values-lecture";
export const COGNIFLOW_SOURCE_PATH_ID = "ex:path-cogniflow-standardized-data-processing";
export const CHEMOMETRICS_BACKGROUND_PACK_ID = "chemometrics-neon-city";
export const LIGHT_BACKGROUND_PACK_ID = "eco-city-light";

export const chemometricsNeonCityPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: CHEMOMETRICS_BACKGROUND_PACK_ID,
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

export const ecoCityLightPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: LIGHT_BACKGROUND_PACK_ID,
  label: "Eco City Light",
  baseColor: "#dbecef",
  layers: Object.freeze([
    Object.freeze({ id: "skyline", asset: "/presentation-backgrounds/eco-city-light/01-seamless-eco-city-skyline.webp", speed: 0.08, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-left", asset: "/presentation-backgrounds/eco-city-light/03-left-facade-slice.webp", speed: 0.22, anchor: "left", repeat: "y", opacity: 0.92, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-right", asset: "/presentation-backgrounds/eco-city-light/04-right-facade-slice.webp", speed: 0.27, anchor: "right", repeat: "y", opacity: 0.92, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "bridges", asset: "/presentation-backgrounds/eco-city-light/05-bridge-tile.webp", speed: 0.44, anchor: "center", repeat: "y", opacity: 0.62, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "sunbeam", asset: "/presentation-backgrounds/eco-city-light/06-sunbeam-sky-overlay.webp", speed: 0.72, anchor: "center", repeat: "y", opacity: 0.42, blendMode: "screen", sizing: "cover-width" }),
  ]),
});

export const backgroundPackRegistry: readonly BackgroundPack[] = Object.freeze([chemometricsNeonCityPack, ecoCityLightPack]);

export const chemometricsPresentationProfile: PresentationProfile = Object.freeze({
  id: "chemometrics",
  label: "Chemometrics and Applied Statistics",
  defaultView: "scroll",
  defaultBackgroundPackId: chemometricsNeonCityPack.id,
});

export const cogniflowPresentationProfile: PresentationProfile = Object.freeze({
  id: "cogniflow-standardized-data-processing",
  label: "Standardized Data Processing - Project CogniFlow",
  defaultView: "scroll",
  defaultBackgroundPackId: chemometricsNeonCityPack.id,
});

export function resolvePresentationAppearance(search: string, sourcePathId?: string): ResolvedPresentationAppearance {
  const params = new URLSearchParams(search);
  const diagnostics: string[] = [];
  const profile = sourcePathId === COGNIFLOW_SOURCE_PATH_ID
    ? cogniflowPresentationProfile
    : chemometricsPresentationProfile;

  const requestedTheme = params.get("theme");
  const theme: PresentationTheme = requestedTheme === "light" || requestedTheme === "dark" ? requestedTheme : "dark";
  if (requestedTheme && requestedTheme !== "light" && requestedTheme !== "dark") diagnostics.push(`Unsupported theme '${requestedTheme}', using '${theme}'.`);

  const requestedView = params.get("view");
  const view: PresentationView = requestedView === "deck" || requestedView === "scroll" ? requestedView : profile.defaultView;
  if (requestedView && requestedView !== "deck" && requestedView !== "scroll") diagnostics.push(`Unsupported view '${requestedView}', using '${view}'.`);

  const requestedBackground = params.get("background");
  let backgroundPackId: string | undefined = theme === "light" ? LIGHT_BACKGROUND_PACK_ID : profile.defaultBackgroundPackId;
  if (requestedBackground === "none") backgroundPackId = undefined;
  else if (requestedBackground) {
    if (backgroundPackRegistry.some((pack) => pack.id === requestedBackground)) backgroundPackId = requestedBackground;
    else diagnostics.push(`Unknown background '${requestedBackground}', using the profile default.`);
  }

  return Object.freeze({ profile, view, theme, ...(backgroundPackId ? { backgroundPackId } : {}), diagnostics: Object.freeze(diagnostics) });
}

export interface AppearanceControlHandle { destroy(): void; }

export function mountAppearanceControls(options: {
  readonly root: HTMLElement;
  readonly currentPackId?: string;
  readonly currentTheme: PresentationTheme;
  readonly onBackgroundChange: (packId: string | undefined) => void;
  readonly onThemeChange: (theme: PresentationTheme) => void;
}): AppearanceControlHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "appearance-controls";
  const themeLabel = document.createElement("label");
  themeLabel.htmlFor = "presentation-theme-select";
  themeLabel.textContent = "Theme";
  const themeSelect = document.createElement("select");
  themeSelect.id = "presentation-theme-select";
  themeSelect.setAttribute("aria-label", "Presentation theme");
  for (const [value, text] of [["dark", "Dark"], ["light", "Light"]] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    themeSelect.append(option);
  }
  themeSelect.value = options.currentTheme;
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
  hint.textContent = "Alt+T theme · Alt+B background";
  const apply = () => options.onBackgroundChange(select.value === "none" ? undefined : select.value);
  const applyTheme = () => options.onThemeChange(themeSelect.value as PresentationTheme);
  const toggle = (event: KeyboardEvent) => {
    if (!event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "t") {
      event.preventDefault();
      themeSelect.value = themeSelect.value === "dark" ? "light" : "dark";
      applyTheme();
      return;
    }
    if (key !== "b") return;
    event.preventDefault();
    select.value = select.value === "none"
      ? (themeSelect.value === "light" ? LIGHT_BACKGROUND_PACK_ID : CHEMOMETRICS_BACKGROUND_PACK_ID)
      : "none";
    apply();
  };
  themeSelect.addEventListener("change", applyTheme);
  select.addEventListener("change", apply);
  window.addEventListener("keydown", toggle);
  wrapper.append(themeLabel, themeSelect, label, select, hint);
  options.root.prepend(wrapper);
  return { destroy() { themeSelect.removeEventListener("change", applyTheme); select.removeEventListener("change", apply); window.removeEventListener("keydown", toggle); wrapper.remove(); } };
}
