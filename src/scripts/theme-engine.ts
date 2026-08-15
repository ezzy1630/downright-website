import { themes } from "../data/site";
import { SpringColor } from "../motion/color";
import { sharedSpringDriver } from "../motion/spring";

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const colorKeys = ["background", "surface", "text", "textSecondary", "textFaint", "heading", "accent", "link", "rule", "selection", "codeBackground", "inlineCodeBackground", "codeRule", "railTick", "railTickCurrent", "quoteRule", "changeAdded", "changeRemoved", "changeModified", "pathMissing", "searchHit", "searchHitCurrent", "calloutNote", "calloutWarning", "calloutSuccess", "calloutDanger"] as const;
const cssKeys: Record<(typeof colorKeys)[number], string> = {
  background: "--bg", surface: "--surface", text: "--text", textSecondary: "--text-secondary", textFaint: "--text-faint", heading: "--heading", accent: "--accent", link: "--link", rule: "--rule", selection: "--selection", codeBackground: "--code-bg", inlineCodeBackground: "--inline-code-bg", codeRule: "--code-rule", railTick: "--rail-tick", railTickCurrent: "--rail-tick-current", quoteRule: "--quote-rule", changeAdded: "--change-added", changeRemoved: "--change-removed", changeModified: "--change-modified", pathMissing: "--path-missing", searchHit: "--search-hit", searchHitCurrent: "--search-hit-current", calloutNote: "--callout-note", calloutWarning: "--callout-warning", calloutSuccess: "--callout-success", calloutDanger: "--callout-danger",
};

function resolvedTheme(id: string) {
  if (id !== "system") return themes.find((theme) => theme.id === id) ?? themes[0];
  return themes.find((theme) => theme.id === (systemDark.matches ? "warm-dark" : "paper-light")) ?? themes[0];
}

function activeId(): string { return localStorage.getItem("downright-theme") ?? "system"; }

export function applyTheme(id: string, immediate = false): void {
  const previous = resolvedTheme(activeId());
  const next = resolvedTheme(id);
  localStorage.setItem("downright-theme", id);
  root.dataset.theme = id;
  root.style.colorScheme = next.appearance === "light" ? "light" : "dark";
  const springs = new Map<(typeof colorKeys)[number], SpringColor>();
  for (const key of colorKeys) {
    const spring = new SpringColor(previous.palette[key], 0.2);
    if (immediate || reducedMotion.matches) spring.snap(next.palette[key]); else spring.setTarget(next.palette[key]);
    springs.set(key, spring);
  }
  const write = () => springs.forEach((spring, key) => root.style.setProperty(cssKeys[key], spring.css()));
  write();
  if (!immediate && !reducedMotion.matches) sharedSpringDriver.add((dt) => { let moving = false; springs.forEach((spring) => { moving = spring.advance(dt) || moving; }); write(); return moving; });
  document.querySelectorAll<HTMLElement>("[data-theme-option]").forEach((option) => {
    const selected = option.dataset.themeOption === id;
    option.setAttribute("aria-selected", String(selected));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next.palette.background);
}

export function setupThemeEngine(): void {
  applyTheme(activeId(), true);
  const trigger = document.querySelector<HTMLButtonElement>(".theme-control__trigger");
  const panel = document.querySelector<HTMLElement>(".theme-panel");
  const closePanel = () => {
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", "false");
    panel.classList.remove("is-open");
    panel.hidden = true;
  };
  if (trigger && panel) {
    trigger.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      panel.classList.toggle("is-open", !open);
      if (!open) panel.querySelector<HTMLButtonElement>("[aria-selected=true]")?.focus();
    });
    document.addEventListener("pointerdown", (event) => { if (!trigger.parentElement?.contains(event.target as Node)) closePanel(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closePanel(); trigger.focus(); } });
  }
  document.querySelectorAll<HTMLButtonElement>("[data-theme-option]").forEach((button) => button.addEventListener("click", () => {
    applyTheme(button.dataset.themeOption ?? "system");
    if (panel?.contains(button)) { closePanel(); trigger?.focus(); }
  }));
  systemDark.addEventListener("change", () => { if (activeId() === "system") applyTheme("system"); });
  reducedMotion.addEventListener("change", () => applyTheme(activeId(), true));
}
