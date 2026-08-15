/**
 * The theme spill: the site's real theme engine. Choosing a theme springs
 * every color token through OKLab (no muddy midpoints) with a radial stagger
 * measured from the clicked control — ink pours across the paper, the whole
 * wave inside one `deliberate` 0.32s. Zones near the click retarget first;
 * the farthest zone starts within 0.12s and springs for `standard` 0.20s.
 * Persisted in localStorage; first visit follows prefers-color-scheme.
 */

import { themes } from "../data/site";
import type { AppTheme } from "../data/site";
import { MOTION, SpringColor, hexToRgb, rgbToOklab, oklabToHex } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";

const STORAGE_KEY = "downright-theme";
const WAVE_SPAN = 0.12;
const WAVE_DURATION = MOTION.durations.standard;

/** Tokens each zone springs. Six keeps moving springs ≤ 80 (§5). */
const ZONE_TOKENS = ["--paper", "--ink", "--secondary", "--rule", "--accent", "--surface"] as const;

type ZoneToken = (typeof ZONE_TOKENS)[number];

const TOKEN_TO_PALETTE: Record<ZoneToken, keyof AppTheme["palette"]> = {
  "--paper": "background",
  "--ink": "text",
  "--secondary": "textSecondary",
  "--rule": "rule",
  "--accent": "accent",
  "--surface": "surface",
};

function themeById(id: string): AppTheme | undefined {
  return themes.find((theme) => theme.id === id);
}

function paletteValue(theme: AppTheme, token: ZoneToken): string {
  return String(theme.palette[TOKEN_TO_PALETTE[token]] ?? theme.palette.background);
}

/** Zones: the surfaces the wave crosses, in DOM order. */
function zones(): HTMLElement[] {
  const found = [...document.querySelectorAll<HTMLElement>("[data-theme-zone]")];
  return found.length ? found : [document.documentElement];
}

let currentId = "system";

export function currentTheme(): string {
  return currentId;
}

/** Resolve "system" against prefers-color-scheme, app-style. */
function effectiveTheme(id: string): AppTheme {
  const resolved =
    id === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "warm-dark"
        : "paper-light"
      : id;
  return themeById(resolved) ?? themeById("paper-light")!;
}

function applyInstant(theme: AppTheme): void {
  const root = document.documentElement;
  for (const [token, key] of Object.entries(TOKEN_TO_PALETTE) as [ZoneToken, keyof AppTheme["palette"]][]) {
    root.style.setProperty(token, String(theme.palette[key] ?? theme.palette.background));
  }
  // Full token set for CSS surfaces that need more than the six.
  for (const [key, value] of Object.entries(theme.palette)) {
    root.style.setProperty(`--theme-${key}`, String(value));
  }
  root.dataset.theme = currentId;
  root.style.colorScheme = theme.appearance === "dark" ? "dark" : "light";
}

function startWave(target: AppTheme, originX: number, originY: number): void {
  if (reducedMotion()) {
    applyInstant(target);
    return;
  }
  const zoneEls = zones();
  let maxDistance = 1;
  const distances = zoneEls.map((zone) => {
    const rect = zone.getBoundingClientRect();
    const distance = Math.hypot(originX - (rect.left + rect.width / 2), originY - (rect.top + rect.height / 2));
    maxDistance = Math.max(maxDistance, distance);
    return distance;
  });

  interface Live {
    zone: HTMLElement;
    springs: { token: ZoneToken; spring: SpringColor }[];
    delay: number;
  }
  const live: Live[] = [];
  zoneEls.forEach((zone, index) => {
    const springs = ZONE_TOKENS.map((token) => {
      const from = getComputedStyle(zone).getPropertyValue(token).trim() || "#000000";
      const spring = new SpringColor(from, WAVE_DURATION);
      spring.setTarget(paletteValue(target, token));
      return { token, spring };
    });
    live.push({ zone, springs, delay: (distances[index] / maxDistance) * WAVE_SPAN });
  });

  let elapsed = 0;
  ticker.add((dt) => {
    elapsed += dt;
    let moving = false;
    for (const entry of live) {
      if (elapsed < entry.delay) {
        moving = true;
        continue;
      }
      let zoneMoving = false;
      for (const { token, spring } of entry.springs) {
        const advanced = spring.advance(dt);
        entry.zone.style.setProperty(token, spring.value);
        if (advanced) zoneMoving = true;
      }
      if (zoneMoving) moving = true;
    }
    if (!moving) applyInstant(target);
    return moving;
  });
}

export function switchTheme(id: string, origin?: { x: number; y: number }): void {
  currentId = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage blocked; the spill still applies for this page view */
  }
  const theme = effectiveTheme(id);
  if (origin) startWave(theme, origin.x, origin.y);
  else applyInstant(theme);
  for (const control of document.querySelectorAll<HTMLElement>("[data-theme-option]")) {
    control.setAttribute("aria-selected", String(control.dataset.themeOption === id));
  }
}

export function initThemeEngine(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = null;
  }
  currentId = saved ?? "system";
  applyInstant(effectiveTheme(currentId));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentId === "system") applyInstant(effectiveTheme("system"));
  });

  for (const control of document.querySelectorAll<HTMLElement>("[data-theme-option]")) {
    control.addEventListener("click", (event) => {
      const id = control.dataset.themeOption ?? "system";
      switchTheme(id, { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
    });
  }
}

export { hexToRgb, rgbToOklab, oklabToHex };
