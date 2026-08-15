/**
 * The theme spill: the site's real theme engine. Choosing a theme springs
 * every key color token through OKLab (no muddy midpoints) with a radial
 * stagger measured from the clicked control — ink pours across the paper, the
 * whole wave inside one `deliberate` 0.32s. Zones near the click retarget
 * first; the farthest zone starts within 0.12s and springs for `standard`.
 * Persisted in localStorage; first visit follows prefers-color-scheme. The
 * header control and the showroom cards drive the same engine and state.
 */

import { themes } from "../data/site";
import type { AppTheme } from "../data/site";
import { MOTION, SpringColor } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";

const STORAGE_KEY = "downright-theme";
const WAVE_SPAN = 0.12;
const WAVE_DURATION = MOTION.durations.standard;

/** The tokens each zone springs — the six that read as "the paper re-inked".
 *  Names are the real CSS custom properties; the rest switch via [data-theme]. */
const ZONE_TOKENS = {
  "--bg": "background",
  "--surface": "surface",
  "--text": "text",
  "--text-secondary": "textSecondary",
  "--rule": "rule",
  "--accent": "accent",
} as const;

type ZoneToken = keyof typeof ZONE_TOKENS;
const TOKEN_NAMES = Object.keys(ZONE_TOKENS) as ZoneToken[];

function themeById(id: string): AppTheme | undefined {
  return themes.find((theme) => theme.id === id);
}

function paletteValue(theme: AppTheme, token: ZoneToken): string {
  return String(theme.palette[ZONE_TOKENS[token]] ?? theme.palette.background);
}

/** Zones: the surfaces the wave crosses, in DOM order. */
function zones(): HTMLElement[] {
  const found = [...document.querySelectorAll<HTMLElement>("[data-theme-zone]")];
  return found.length ? found : [document.documentElement];
}

/** Warm Dark is the house ground — the default for every first visit. A
 *  chosen theme persists; "system" is one of the six choices, not the fallback. */
const DEFAULT_THEME = "warm-dark";

let currentId = DEFAULT_THEME;

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

function clearInline(zone: HTMLElement): void {
  for (const token of TOKEN_NAMES) zone.style.removeProperty(token);
}

/** Instant apply: flip the data-theme and drop any wave overrides. */
function applyInstant(theme: AppTheme): void {
  const root = document.documentElement;
  root.dataset.theme = currentId;
  root.style.colorScheme = theme.appearance === "dark" ? "dark" : "light";
  for (const zone of zones()) clearInline(zone);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.palette.background);
}

function startWave(target: AppTheme, originX: number, originY: number): void {
  if (reducedMotion()) {
    applyInstant(target);
    return;
  }

  const zoneEls = zones();
  // Capture each zone's current values BEFORE the data-theme flip.
  const fromValues = zoneEls.map((zone) => {
    const values = {} as Record<ZoneToken, string>;
    for (const token of TOKEN_NAMES) {
      values[token] = getComputedStyle(zone).getPropertyValue(token).trim() || paletteValue(target, token);
    }
    return values;
  });

  let maxDistance = 1;
  const distances = zoneEls.map((zone) => {
    const rect = zone.getBoundingClientRect();
    const distance = Math.hypot(originX - (rect.left + rect.width / 2), originY - (rect.top + rect.height / 2));
    maxDistance = Math.max(maxDistance, distance);
    return distance;
  });

  // Flip the non-sprung tokens instantly, then hold each zone at "from"
  // inline so nothing flashes before its own turn in the wave.
  const root = document.documentElement;
  root.dataset.theme = currentId;
  root.style.colorScheme = target.appearance === "dark" ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", target.palette.background);

  interface Live {
    zone: HTMLElement;
    springs: { token: ZoneToken; spring: SpringColor }[];
    delay: number;
  }
  const live: Live[] = zoneEls.map((zone, index) => {
    const springs = TOKEN_NAMES.map((token) => {
      const spring = new SpringColor(fromValues[index][token], WAVE_DURATION);
      spring.setTarget(paletteValue(target, token));
      zone.style.setProperty(token, spring.value);
      return { token, spring };
    });
    return { zone, springs, delay: (distances[index] / maxDistance) * WAVE_SPAN };
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
    if (!moving) {
      // Hand the colors back to the stylesheet — clean, no stale overrides.
      for (const entry of live) clearInline(entry.zone);
    }
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
  currentId = saved ?? DEFAULT_THEME;
  applyInstant(effectiveTheme(currentId));
  for (const control of document.querySelectorAll<HTMLElement>("[data-theme-option]")) {
    control.setAttribute("aria-selected", String(control.dataset.themeOption === currentId));
  }
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
