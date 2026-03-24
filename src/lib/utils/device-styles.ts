import type { BlockStyles } from "@/types";

export type DeviceType = "desktop" | "tablet" | "mobile";

/**
 * Merge base (desktop) styles with device-specific overrides.
 * Cascade: desktop → tablet → mobile (mobile inherits tablet overrides too).
 */
export function mergeDeviceStyles(
  base: BlockStyles,
  tabletOverrides: Partial<BlockStyles> | undefined | null,
  mobileOverrides: Partial<BlockStyles> | undefined | null,
  device: DeviceType,
): BlockStyles {
  if (device === "desktop") return base;
  if (device === "tablet") {
    return tabletOverrides && Object.keys(tabletOverrides).length > 0
      ? { ...base, ...tabletOverrides }
      : base;
  }
  // Mobile: cascade tablet → mobile
  const withTablet = tabletOverrides && Object.keys(tabletOverrides).length > 0
    ? { ...base, ...tabletOverrides }
    : base;
  return mobileOverrides && Object.keys(mobileOverrides).length > 0
    ? { ...withTablet, ...mobileOverrides }
    : withTablet;
}

/**
 * Extract only the properties that differ from base styles.
 * Used when saving device-specific overrides (sparse diff).
 */
export function extractOverrides(
  base: BlockStyles,
  modified: BlockStyles,
): Partial<BlockStyles> {
  const overrides: Record<string, unknown> = {};
  for (const key of Object.keys(modified) as (keyof BlockStyles)[]) {
    if (JSON.stringify(modified[key]) !== JSON.stringify(base[key])) {
      overrides[key] = modified[key];
    }
  }
  return overrides as Partial<BlockStyles>;
}

/**
 * Detect device type from viewport width.
 */
export function getDeviceType(width: number): DeviceType {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
