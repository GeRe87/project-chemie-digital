import type { BackgroundPack } from "../../../packages/renderer-reveal/src/background/background-pack.ts";
import {
  flattenThemedBackgroundPacks,
  resolveThemedBackgroundPack,
  type PresentationThemeMode,
  type ThemedBackgroundPackFamily,
} from "../../../packages/renderer-reveal/src/background/themed-background.ts";

export type PresentationView = "scroll" | "deck";
export type DiagramThemeId = "neutral" | "eco-city";

export interface PresenterCapabilities {
  readonly clock?: boolean;
  readonly laserPointer?: boolean;
}

export interface PresentationProjectionCapabilities {
  readonly publication?: boolean;
}

export type PresentationViewportPolicy = "fixed-canvas" | "native-portrait";
export type PresentationReadabilityMode = "standard" | "lecture";

export interface PresentationProfile {
  readonly id: string;
  readonly label: string;
  readonly defaultView: PresentationView;
  readonly defaultTheme: PresentationThemeMode;
  readonly defaultBackgroundFamilyId?: string;
  readonly presenterCapabilities?: PresenterCapabilities;
  readonly projectionCapabilities?: PresentationProjectionCapabilities;
  readonly viewportPolicy?: PresentationViewportPolicy;
  readonly defaultReadability?: PresentationReadabilityMode;
  readonly backgroundProgressAxis?: "horizontal" | "vertical";
  readonly supportedViews?: readonly PresentationView[];
  readonly backgroundFamilyIds?: readonly string[];
}

export interface ResolvedPresentationAppearance {
  readonly profile: PresentationProfile;
  readonly view: PresentationView;
  readonly theme: PresentationThemeMode;
  readonly backgroundEnabled: boolean;
  readonly backgroundFamilyId?: string;
  readonly backgroundPackId?: string;
  readonly diagramThemeId: DiagramThemeId;
  readonly readability: PresentationReadabilityMode;
  readonly diagnostics: readonly string[];
}

export const CHEMOMETRICS_SOURCE_PATH_ID = "ex:path-chemometrics-mean-values-lecture";
export const COGNIFLOW_SOURCE_PATH_ID = "ex:path-cogniflow-standardized-data-processing";

const chemometricsCityDarkPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: "chemometrics-city-dark",
  label: "Eco City: Dark",
  baseColor: "#07101f",
  layers: Object.freeze([
    Object.freeze({ id: "bg-skyline", asset: "/presentation-backgrounds/chemometrics-neon-city/bg-skyline.webp", speed: 0.08, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-left", asset: "/presentation-backgrounds/chemometrics-neon-city/facade-left.webp", speed: 0.22, anchor: "left", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-right", asset: "/presentation-backgrounds/chemometrics-neon-city/facade-right.webp", speed: 0.27, anchor: "right", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "bridges", asset: "/presentation-backgrounds/chemometrics-neon-city/bridges.webp", speed: 0.44, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "atmosphere", asset: "/presentation-backgrounds/chemometrics-neon-city/rain-fog.webp", speed: 0.72, anchor: "center", repeat: "y", opacity: 0.18, blendMode: "screen", sizing: "cover-width" }),
  ]),
});

const chemometricsCityLightPack: BackgroundPack = Object.freeze({
  version: "1.0",
  id: "chemometrics-city-light",
  label: "Eco City: Light",
  baseColor: "#dff4ff",
  layers: Object.freeze([
    Object.freeze({ id: "bg-skyline", asset: "/presentation-backgrounds/chemometrics-city/light/bg-skyline.webp", speed: 0.08, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-left", asset: "/presentation-backgrounds/chemometrics-city/light/facade-left.webp", speed: 0.22, anchor: "left", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "facade-right", asset: "/presentation-backgrounds/chemometrics-city/light/facade-right.webp", speed: 0.27, anchor: "right", repeat: "y", opacity: 0.95, blendMode: "normal", sizing: "cover-width" }),
    Object.freeze({ id: "bridges", asset: "/presentation-backgrounds/chemometrics-city/light/bridges.webp", speed: 0.44, anchor: "center", repeat: "y", opacity: 1, blendMode: "normal", sizing: "cover-width" }),
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

function laboratoryPack(theme: PresentationThemeMode): BackgroundPack {
  return {
    version: "1.0", id: `talks-laboratory-${theme}`, label: `Laboratory: ${theme}`,
    baseColor: theme === "dark" ? "#09213c" : "#e7f4fc",
    layers: ["back", "middle", "front"].map((id, index) => ({
      id, asset: `/talks-assets/${id}_layer_${theme}.webp`, speed: [0.12, 0.33, 0.61][index]!,
      anchor: "center" as const, repeat: "x" as const, opacity: 1, sizing: "cover-height" as const,
    })),
  };
}

export const talksLaboratoryFamily: ThemedBackgroundPackFamily = {
  id: "talks-laboratory", label: "Laboratory",
  variants: { dark: laboratoryPack("dark"), light: laboratoryPack("light") },
};

export const talksPresentationProfile: PresentationProfile = {
  id: "scientific-talks", label: "Scientific presentations", defaultView: "deck", defaultTheme: "dark",
  defaultBackgroundFamilyId: talksLaboratoryFamily.id, viewportPolicy: "native-portrait",
  backgroundProgressAxis: "horizontal",
  supportedViews: ["deck"],
  backgroundFamilyIds: [talksLaboratoryFamily.id],
  presenterCapabilities: { clock: true, laserPointer: true },
};

export const backgroundFamilyRegistry: readonly ThemedBackgroundPackFamily[] = Object.freeze([chemometricsCityFamily]);
const allBackgroundFamilies = [...backgroundFamilyRegistry, talksLaboratoryFamily];
export const backgroundPackRegistry: readonly BackgroundPack[] = flattenThemedBackgroundPacks(allBackgroundFamilies);

export function availableBackgroundFamilies(profile: PresentationProfile): readonly ThemedBackgroundPackFamily[] {
  return profile.backgroundFamilyIds
    ? allBackgroundFamilies.filter(family => profile.backgroundFamilyIds!.includes(family.id))
    : backgroundFamilyRegistry;
}

export const chemometricsPresentationProfile: PresentationProfile = Object.freeze({
  id: "chemometrics",
  label: "Chemometrics and Applied Statistics",
  defaultView: "scroll",
  defaultTheme: "dark",
  defaultBackgroundFamilyId: chemometricsCityFamily.id,
  defaultReadability: "lecture",
});

export const cogniflowPresentationProfile: PresentationProfile = Object.freeze({
  id: "cogniflow-standardized-data-processing",
  label: "From FAIR Data to FAIR Data Processing: Project CogniFlow",
  defaultView: "scroll",
  defaultTheme: "light",
  defaultBackgroundFamilyId: chemometricsCityFamily.id,
  presenterCapabilities: Object.freeze({
    clock: true,
    laserPointer: true,
  }),
  projectionCapabilities: Object.freeze({
    publication: true,
  }),
  viewportPolicy: "native-portrait",
  defaultReadability: "standard",
});

export function findBackgroundFamily(familyId: string | undefined): ThemedBackgroundPackFamily | undefined {
  if (!familyId) return undefined;
  return allBackgroundFamilies.find((family) => family.id === familyId);
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

export function resolvePresentationAppearance(search: string, sourcePathId?: string, configuredProfile?: PresentationProfile): ResolvedPresentationAppearance {
  const params = new URLSearchParams(search);
  const diagnostics: string[] = [];
  const profile = configuredProfile ?? resolveProfile(sourcePathId);

  const requestedView = params.get("view");
  const candidateView: PresentationView = requestedView === "deck" || requestedView === "scroll" ? requestedView : profile.defaultView;
  const view = profile.supportedViews && !profile.supportedViews.includes(candidateView) ? profile.defaultView : candidateView;
  if (requestedView && requestedView !== "deck" && requestedView !== "scroll") {
    diagnostics.push(`Unsupported view '${requestedView}', using '${view}'.`);
  }

  const requestedReadability = params.get("readability");
  const defaultReadability = profile.defaultReadability ?? "standard";
  const readability: PresentationReadabilityMode =
    requestedReadability === "lecture" || requestedReadability === "standard"
      ? requestedReadability
      : defaultReadability;
  if (requestedReadability && requestedReadability !== "lecture" && requestedReadability !== "standard") {
    diagnostics.push(`Unsupported readability '${requestedReadability}', using '${readability}'.`);
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
    if (requestedFamily && availableBackgroundFamilies(profile).some(f => f.id === requestedFamily.id)) {
      backgroundFamilyId = requestedFamily.id;
      backgroundEnabled = true;
    } else if (requestedBackground === "chemometrics-neon-city" && availableBackgroundFamilies(profile).some(f => f.id === chemometricsCityFamily.id)) {
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
    readability,
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
  readonly families?: readonly ThemedBackgroundPackFamily[];
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
  const families = options.families ?? backgroundFamilyRegistry;
  for (const family of families) {
    const option = document.createElement("option");
    option.value = family.id;
    option.textContent = family.label;
    backgroundSelect.append(option);
  }

  let lastFamilyId = options.currentFamilyId ?? families[0]?.id;
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
  const screenControls=document.createElement("div");screenControls.className="pcd-screen-controls";
  const lamp=document.createElement("button");lamp.type="button";lamp.className="pcd-theme-toggle";
  lamp.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 1v2M3 5l2 2M21 5l-2 2M1 12h2M21 12h2" stroke="currentColor" stroke-width="1.5"/></svg>';
  const syncLamp=()=>{const light=themeSelect.value==="light";lamp.setAttribute("aria-pressed",String(light));lamp.setAttribute("aria-label",light?"Switch to dark mode":"Switch to light mode");lamp.title=lamp.getAttribute("aria-label")!;};
  syncLamp();screenControls.append(lamp);document.body.append(screenControls);

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
  const applyTheme = () => {syncLamp();options.onThemeChange(themeSelect.value as PresentationThemeMode);};

  const toggleBackground = () => {
    if (backgroundSelect.value === "none") {
      const nextFamilyId = lastFamilyId ?? families[0]?.id;
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
  lamp.addEventListener("click",toggleTheme);

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
      lamp.removeEventListener("click",toggleTheme);screenControls.remove();
    },
  };
}
