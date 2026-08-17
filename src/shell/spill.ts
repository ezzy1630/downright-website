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
import { sound } from "../kernel/sound";

const STORAGE_KEY = "downright-theme";
const WAVE_SPAN = 0.12;
const WAVE_DURATION = MOTION.durations.standard;

function themeById(id: string): AppTheme | undefined {
  return themes.find((theme) => theme.id === id);
}

/** Zones: the surfaces the wave crosses, in DOM order. */
function zones(): HTMLElement[] {
  const root = document.documentElement;
  const found = [...document.querySelectorAll<HTMLElement>("[data-theme-zone]")]
    .filter((zone) => zone !== document.body && zone !== root);
  return [root, ...found];
}

/** Warm Dark is the house ground — the default for every first visit. A
 *  chosen theme persists; "system" is one of the six choices, not the fallback. */
const DEFAULT_THEME = "warm-dark";

let currentId = DEFAULT_THEME;
let detachWave: (() => void) | null = null;
let tokenNames: string[] = [];

// CSSStyleDeclaration custom-property enumeration is not consistent in Safari.
// These are the source color tokens from tokens.css; aliases (band colors and
// shadows) inherit from them and do not need a second animation channel.
const COLOR_TOKENS = [
  "--bg",
  "--surface",
  "--text",
  "--text-secondary",
  "--text-faint",
  "--heading",
  "--marker",
  "--accent",
  "--link",
  "--rule",
  "--selection",
  "--code-bg",
  "--inline-code-bg",
  "--code-rule",
  "--rail-tick",
  "--rail-tick-current",
  "--quote-rule",
  "--change-added",
  "--change-removed",
  "--change-modified",
  "--path-missing",
  "--search-hit",
  "--search-hit-current",
  "--callout-note",
  "--callout-warning",
  "--callout-success",
  "--callout-danger",
  "--syntax-keyword",
  "--syntax-string",
  "--syntax-number",
  "--syntax-comment",
  "--syntax-type",
  "--syntax-function",
  "--syntax-variable",
  "--syntax-constant",
  "--syntax-operator",
  "--syntax-punctuation",
  "--syntax-attribute",
  "--syntax-diff-added",
  "--syntax-diff-removed",
  "--syntax-diff-header",
  "--cta-fill",
  "--cta-ink",
] as const;

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

/** Generated theme colors are already present as CSS custom properties. Read
 * the live values so JS ships no duplicate palette table. */
function refreshTokenNames(): void {
  const styles = getComputedStyle(document.documentElement);
  tokenNames = COLOR_TOKENS.filter((name) => styles.getPropertyValue(name).trim()).map((name) => name);
}

function clearInline(zone: HTMLElement): void {
  for (const token of tokenNames) zone.style.removeProperty(token);
}

function stopWave(): void {
  detachWave?.();
  detachWave = null;
}

/** Instant apply: flip the data-theme and drop any wave overrides. */
function applyInstant(theme: AppTheme): void {
  stopWave();
  const root = document.documentElement;
  root.dataset.theme = currentId;
  refreshTokenNames();
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

  stopWave();
  const zoneEls = zones();
  if (!tokenNames.length) refreshTokenNames();
  // Capture and pin each zone's current values BEFORE the data-theme flip.
  // This is the important ordering guarantee: the target stylesheet can load
  // underneath the inline "from" values without painting a mixed palette.
  const fromValues = zoneEls.map((zone) => {
    const styles = getComputedStyle(zone);
    return tokenNames.map((token) => {
      const value = styles.getPropertyValue(token).trim();
      zone.style.setProperty(token, value);
      return value;
    });
  });

  // Read target colors from the generated stylesheet instead of shipping a
  // second palette table in JS. Band aliases follow these source tokens.
  const root = document.documentElement;
  for (const zone of zoneEls) clearInline(zone);
  root.dataset.theme = currentId;
  const targetStyle = getComputedStyle(root);
  const targetValues = tokenNames.map((token) => targetStyle.getPropertyValue(token).trim());
  zoneEls.forEach((zone, index) => {
    tokenNames.forEach((token, tokenIndex) => zone.style.setProperty(token, fromValues[index][tokenIndex]));
  });

  let maxDistance = 1;
  const distances = zoneEls.map((zone) => {
    const rect = zone.getBoundingClientRect();
    const distance = Math.hypot(originX - (rect.left + rect.width / 2), originY - (rect.top + rect.height / 2));
    maxDistance = Math.max(maxDistance, distance);
    return distance;
  });

  // Flip the stylesheet only after every color is pinned to its old value.
  // Non-color geometry can change with the theme without exposing a mixed ink.
  interface Live {
    zone: HTMLElement;
    springs: { token: string; spring: SpringColor }[];
    delay: number;
  }
  const live: Live[] = zoneEls.map((zone, index) => {
    const springs = tokenNames.map((token, tokenIndex) => {
      const spring = new SpringColor(fromValues[index][tokenIndex], WAVE_DURATION);
      spring.setTarget(targetValues[tokenIndex]);
      return { token, spring };
    });
    return { zone, springs, delay: (distances[index] / maxDistance) * WAVE_SPAN };
  });

  let elapsed = 0;
  const wave = (dt: number): boolean => {
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
      root.style.colorScheme = target.appearance === "dark" ? "dark" : "light";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", target.palette.background);
      detachWave = null;
    }
    return moving;
  };
  detachWave = ticker.add(wave);
}

export function switchTheme(id: string, origin?: { x: number; y: number }): void {
  currentId = id;
  sound.tick();
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

  for (const container of document.querySelectorAll<HTMLElement>("[data-theme-control]")) {
    const trigger = container.querySelector<HTMLButtonElement>(".theme-control__trigger");
    const panel = container.querySelector<HTMLElement>(".theme-panel");
    if (!trigger || !panel) continue;
    panel.addEventListener("toggle", () => {
      trigger.setAttribute("aria-expanded", String(panel.matches(":popover-open")));
    });
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
