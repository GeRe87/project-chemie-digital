import type { BackgroundPack } from "../../../packages/renderer-reveal/src/background/background-pack.ts";
import {
  flattenThemedBackgroundPacks,
  resolveThemedBackgroundPack,
  type PresentationThemeMode,
  type ThemedBackgroundPackFamily,
} from "../../../packages/renderer-reveal/src/background/themed-background.ts";

export type PresentationView = "scroll" | "deck";
export type DiagramThemeId = "neutral" | "eco-city";

export interface PresentationProfile {
  readonly id: string;
  readonly label: string;
  readonly defaultView: PresentationView;
  readonly defaultTheme: PresentationThemeMode;
  readonly defaultBackgroundFamilyId?: string;
}

export interface ResolvedPresentationAppearance {
  readonly profile: PresentationProfile;
  readonly view: PresentationView;
  readonly theme: PresentationThemeMode;
  readonly backgroundEnabled: boolean;
  readonly backgroundFamilyId?: string;
  readonly backgroundPackId?: string;
  readonly diagramThemeId: DiagramThemeId;
  readonly diagnostics: readonly string[];
}

export const CHEMOMETRICS_SOURCE_PATH_ID = "ex:path-chemometrics-mean-values-lecture";
export const COGNIFLOW_SOURCE_PATH_ID = "ex:path-cogniflow-standardized-data-processing";

const chemometricsCityDarkPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: "chemometrics-city-dark",
  label: "Eco City — Dark",
  baseColor: "#07101f",
  layers: Object.freeze([
    Object.freeze({ id: "bg-skyline", asset: "/presentation-backgrounds/chemometrics-neon-city/bg-skyline.webp", speed: 0.08, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-left", asset: "/presentation-backgrounds/chemometrics-neon-city/facade-left.webp", speed: 0.22, anchor: "left", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-right", asset: "/presentation-backgrounds/chemometrics-neon-city/facade-right.webp", speed: 0.27, anchor: "right", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "bridges", asset: "/presentation-backgrounds/chemometrics-neon-city/bridges.webp", speed: 0.44, anchor: "center", repeat: "y", opacity: 0.55, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "atmosphere", asset: "/presentation-backgrounds/chemometrics-neon-city/rain-fog.webp", speed: 0.72, anchor: "center", repeat: "y", opacity: 0.18, blendMode: "screen", sizing: "cover-width" }),
  ]),
});

const chemometricsCityLightPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: "chemometrics-city-light",
  label: "Eco City — Light",
  baseColor: "#dff4ff",
  layers: Object.freeze([
    Object.freeze({ id: "bg-skyline", asset: "/presentation-backgrounds/chemometrics-city/light/bg-skyline.webp", speed: 0.08, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-left", asset: "/presentation-backgrounds/chemometrics-city/light/facade-left.webp", speed: 0.22, anchor: "left", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-right", asset: "/presentation-backgrounds/chemometrics-city/light/facade-right.webp", speed: 0.27, anchor: "right", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "bridges", asset: "/presentation-backgrounds/chemometrics-city/light/bridges.webp", speed: 0.44, anchor: "center", repeat: "y", opacity: 0.52, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "atmosphere", asset: "/presentation-backgrounds/chemometrics-city/light/sunbeam-sky-overlay.webp", speed: 0.72, anchor: "center", repeat: "y", opacity: 0.24, blendMode: "screen", sizing: "cover-width" }),
  ]),
});

export const chemometricsCityFamily: ThemedBackgroundPackFamily = Object.freeze({
  id: "chemometrics-city",
  label: "Eco City",
  variants: Object.freeze({
    dark: chemometricsCityDarkPack,
    light: chemometricsCityLightPack,
  }),
});

export const backgroundFamilyRegistry: readonly ThemedBackgroundPackFamily[] = Object.freeze([chemometricsCityFamily]);
export const backgroundPackRegistry: readonly BackgroundPack[] = flattenThemedBackgroundPacks(backgroundFamilyRegistry);

export const chemometricsPresentationProfile: PresentationProfile = Object.freeze({
  id: "chemometrics",
  label: "Chemometrics and Applied Statistics",
  defaultView: "scroll",
  defaultTheme: "dark",
  defaultBackgroundFamilyId: chemometricsCityFamily.id,
});

export const cogniflowPresentationProfile: PresentationProfile = Object.freeze({
  id: "cogniflow-standardized-data-processing",
  label: "Standardized Data Processing - Project CogniFlow",
  defaultView: "scroll",
  defaultTheme: "light",
  defaultBackgroundFamilyId: chemometricsCityFamily.id,
});

export function findBackgroundFamily(familyId: string | undefined): ThemedBackgroundPackFamily | undefined {
  if (!familyId) return undefined;
  return backgroundFamilyRegistry.find((family) => family.id === familyId);
}

export function resolveBackgroundPackId(
  familyId: string | undefined,
  theme: PresentationThemeMode,
): string | undefined {
  const family = findBackgroundFamily(familyId);
  return family ? resolveThemedBackgroundPack(family, theme).id : undefined;
}

/** Diagram visuals belong to the same family as the presentation world. */
export function resolveDiagramThemeId(
  familyId: string | undefined,
  backgroundEnabled = true,
): DiagramThemeId {
  if (!backgroundEnabled) return "neutral";
  return familyId === chemometricsCityFamily.id ? "eco-city" : "neutral";
}

function resolveProfile(sourcePathId?: string): PresentationProfile {
  return sourcePathId === COGNIFLOW_SOURCE_PATH_ID
    ? cogniflowPresentationProfile
    : chemometricsPresentationProfile;
}

export function resolvePresentationAppearance(search: string, sourcePathId?: string): ResolvedPresentationAppearance {
  const params = new URLSearchParams(search);
  const diagnostics: string[] = [];
  const profile = resolveProfile(sourcePathId);

  const requestedView = params.get("view");
  const view: PresentationView = requestedView === "deck" || requestedView === "scroll" ? requestedView : profile.defaultView;
  if (requestedView && requestedView !== "deck" && requestedView !== "scroll") {
    diagnostics.push(`Unsupported view '${requestedView}', using '${view}'.`);
  }

  const requestedTheme = params.get("theme");
  const theme: PresentationThemeMode = requestedTheme === "dark" || requestedTheme === "light"
    ? requestedTheme
    : profile.defaultTheme;
  if (requestedTheme && requestedTheme !== "dark" && requestedTheme !== "light") {
    diagnostics.push(`Unsupported theme '${requestedTheme}', using '${theme}'.`);
  }

  let backgroundFamilyId = profile.defaultBackgroundFamilyId;
  let backgroundEnabled = Boolean(backgroundFamilyId);
  const requestedBackground = params.get("background");
  if (requestedBackground === "none") {
    backgroundEnabled = false;
  } else if (requestedBackground) {
    const requestedFamily = findBackgroundFamily(requestedBackground);
    if (requestedFamily) {
      backgroundFamilyId = requestedFamily.id;
      backgroundEnabled = true;
    } else if (requestedBackground === "chemometrics-neon-city") {
      // Preserve old shared links while exposing only the family id going forward.
      backgroundFamilyId = chemometricsCityFamily.id;
      backgroundEnabled = true;
    } else {
      diagnostics.push(`Unknown background '${requestedBackground}', using the profile default.`);
    }
  }

  const backgroundPackId = backgroundEnabled ? resolveBackgroundPackId(backgroundFamilyId, theme) : undefined;
  const diagramThemeId = resolveDiagramThemeId(backgroundFamilyId, backgroundEnabled);
  return Object.freeze({
    profile,
    view,
    theme,
    backgroundEnabled,
    ...(backgroundFamilyId ? { backgroundFamilyId } : {}),
    ...(backgroundPackId ? { backgroundPackId } : {}),
    diagramThemeId,
    diagnostics: Object.freeze(diagnostics),
  });
}

export interface AppearanceControlHandle { destroy(): void; }

export function mountAppearanceControls(options: {
  readonly root: HTMLElement;
  readonly currentFamilyId?: string;
  readonly backgroundEnabled: boolean;
  readonly theme: PresentationThemeMode;
  readonly onBackgroundChange: (familyId: string | undefined) => void;
  readonly onThemeChange: (theme: PresentationThemeMode) => void;
}): AppearanceControlHandle {
  const wrapper = document.createElement("div");
  wrapper.className = "appearance-controls";

  const backgroundLabel = document.createElement("label");
  backgroundLabel.htmlFor = "presentation-background-select";
  backgroundLabel.textContent = "Background";
  const backgroundSelect = document.createElement("select");
  backgroundSelect.id = "presentation-background-select";
  backgroundSelect.setAttribute("aria-label", "Presentation background");
  const none = document.createElement("option");
  none.value = "none";
  none.textContent = "None";
  backgroundSelect.append(none);
  for (const family of backgroundFamilyRegistry) {
    const option = document.createElement("option");
    option.value = family.id;
    option.textContent = family.label;
    backgroundSelect.append(option);
  }

  let lastFamilyId = options.currentFamilyId ?? backgroundFamilyRegistry[0]?.id;
  backgroundSelect.value = options.backgroundEnabled && options.currentFamilyId ? options.currentFamilyId : "none";

  const themeLabel = document.createElement("label");
  themeLabel.htmlFor = "presentation-theme-select";
  themeLabel.textContent = "Theme";
  const themeSelect = document.createElement("select");
  themeSelect.id = "presentation-theme-select";
  themeSelect.setAttribute("aria-label", "Presentation theme");
  for (const theme of ["dark", "light"] as const) {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme === "dark" ? "Dark" : "Light";
    themeSelect.append(option);
  }
  themeSelect.value = options.theme;

  const hint = document.createElement("span");
  hint.className = "appearance-controls-hint";
  hint.textContent = "Alt+B background · Alt+T theme";

  const applyBackground = () => {
    if (backgroundSelect.value === "none") {
      options.onBackgroundChange(undefined);
      return;
    }
    lastFamilyId = backgroundSelect.value;
    options.onBackgroundChange(backgroundSelect.value);
  };
  const applyTheme = () => options.onThemeChange(themeSelect.value as PresentationThemeMode);

  const toggleBackground = () => {
    if (backgroundSelect.value === "none") {
      const nextFamilyId = lastFamilyId ?? backgroundFamilyRegistry[0]?.id;
      if (!nextFamilyId) return;
      backgroundSelect.value = nextFamilyId;
      lastFamilyId = nextFamilyId;
    } else {
      lastFamilyId = backgroundSelect.value;
      backgroundSelect.value = "none";
    }
    applyBackground();
  };

  const toggleTheme = () => {
    themeSelect.value = themeSelect.value === "dark" ? "light" : "dark";
    applyTheme();
  };

  const shortcut = (event: KeyboardEvent) => {
    if (!event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      toggleBackground();
    } else if (key === "t") {
      event.preventDefault();
      toggleTheme();
    }
  };

  backgroundSelect.addEventListener("change", applyBackground);
  themeSelect.addEventListener("change", applyTheme);
  window.addEventListener("keydown", shortcut);
  wrapper.append(backgroundLabel, backgroundSelect, themeLabel, themeSelect, hint);
  options.root.prepend(wrapper);

  let destroyed = false;
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      backgroundSelect.removeEventListener("change", applyBackground);
      themeSelect.removeEventListener("change", applyTheme);
      window.removeEventListener("keydown", shortcut);
      wrapper.remove();
    },
  };
}
