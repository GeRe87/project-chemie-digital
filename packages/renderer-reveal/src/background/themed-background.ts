import {
  BackgroundPackError,
  validateBackgroundPack,
  type BackgroundPack,
} from "./background-pack.ts";

export type PresentationThemeMode = "dark" | "light";

export interface ThemedBackgroundPackFamily {
  readonly id: string;
  readonly label: string;
  readonly variants: Readonly<Record<PresentationThemeMode, BackgroundPack>>;
}

const THEME_MODES: readonly PresentationThemeMode[] = Object.freeze(["dark", "light"]);

export function validateThemedBackgroundPackFamily(family: ThemedBackgroundPackFamily): void {
  if (!family.id.trim() || !family.label.trim()) {
    throw new BackgroundPackError("INVALID_BACKGROUND_PACK", "Background family id and label are required", family.id);
  }

  const variants = (family as { variants?: Partial<Record<PresentationThemeMode, BackgroundPack>> }).variants;
  if (!variants) {
    throw new BackgroundPackError("INVALID_BACKGROUND_PACK", `Background family ${family.id} must define dark and light variants`, family.id);
  }

  const concreteIds = new Set<string>();
  for (const theme of THEME_MODES) {
    const pack = variants[theme];
    if (!pack) {
      throw new BackgroundPackError("INVALID_BACKGROUND_PACK", `Background family ${family.id} is missing its ${theme} variant`, family.id);
    }
    validateBackgroundPack(pack);
    if (concreteIds.has(pack.id)) {
      throw new BackgroundPackError("INVALID_BACKGROUND_PACK", `Background family ${family.id} must use distinct concrete pack ids`, family.id);
    }
    concreteIds.add(pack.id);
  }
}

export function resolveThemedBackgroundPack(
  family: ThemedBackgroundPackFamily,
  theme: PresentationThemeMode,
): BackgroundPack {
  validateThemedBackgroundPackFamily(family);
  return family.variants[theme];
}

export function flattenThemedBackgroundPacks(
  families: readonly ThemedBackgroundPackFamily[],
): readonly BackgroundPack[] {
  const familyIds = new Set<string>();
  const packIds = new Set<string>();
  const packs: BackgroundPack[] = [];

  for (const family of families) {
    validateThemedBackgroundPackFamily(family);
    if (familyIds.has(family.id)) {
      throw new BackgroundPackError("INVALID_BACKGROUND_PACK", `Duplicate background family id ${family.id}`, family.id);
    }
    familyIds.add(family.id);

    for (const theme of THEME_MODES) {
      const pack = family.variants[theme];
      if (packIds.has(pack.id)) {
        throw new BackgroundPackError("INVALID_BACKGROUND_PACK", `Duplicate concrete background pack id ${pack.id}`, family.id);
      }
      packIds.add(pack.id);
      packs.push(pack);
    }
  }

  return Object.freeze(packs);
}
