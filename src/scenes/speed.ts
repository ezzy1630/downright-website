/**
 * Speed: native benchmarks with budgets beside them, drawn once on the
 * `deliberate` curve (log scale) — every number traces to the payload. The
 * reader's own session joins the table: the editor's median measured parse
 * this visit, beside the native engine's stated keystroke budget.
 */

import { reducedMotion } from "../kernel/switchboard";
import { medianParseMs } from "../editor/stats";
import { benchmarks } from "../data/site";
import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";

export function initSpeed(): void {
  const section = document.querySelector<HTMLElement>("[data-speed-section]");
  const rows = [...(section?.querySelectorAll<HTMLElement>("[data-budget-row]") ?? [])];
  if (!section || !rows.length) return;

  const draw = (): void => {
    if (section.dataset.drawn === "true") return;
    section.dataset.drawn = "true";
    for (const row of rows) {
      const bar = row.querySelector<HTMLElement>("[data-budget-bar]");
      if (!bar) continue;
      const value = Number(row.dataset.value ?? "0");
      const scale = Number(row.dataset.scale ?? "1");
      // Log scale: a 0.1ms parse and an 8ms budget share one axis.
      const width = Math.min(100, (Math.log10(value * 10 + 1) / Math.log10(scale * 10 + 1)) * 100);
      bar.style.width = reducedMotion() ? `${width}%` : "0%";
      if (!reducedMotion()) {
        requestAnimationFrame(() => {
          bar.style.transition = `width ${MOTION.durations.deliberate}s ${MOTION.curves.structural}`;
          bar.style.width = `${width}%`;
        });
        // The numbers count to their values as the bars grow — the table
        // wakes up instead of arriving finished.
        for (const cell of row.querySelectorAll<HTMLElement>("td:nth-of-type(1), td:nth-of-type(2)")) countUp(cell);
      }
    }
    joinSession();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        draw();
      }
    },
    { threshold: 0.3 },
  );
  observer.observe(section);
}

/** Tween a "0.18 ms"-style cell from zero on the deliberate curve. */
function countUp(cell: HTMLElement): void {
  const match = (cell.textContent ?? "").match(/^([\d.]+)\s*(\S[\s\S]*)$/);
  if (!match) return;
  const target = Number(match[1]);
  const decimals = (match[1].split(".")[1] ?? "").length;
  const suffix = match[2];
  const value = new SpringScalar(0, MOTION.durations.deliberate, 0.12);
  value.setTarget(target);
  ticker.add((dt) => {
    const moving = value.advance(dt);
    cell.textContent = moving
      ? `${value.value.toFixed(decimals)} ${suffix}`
      : `${target.toFixed(decimals)} ${suffix}`;
    return moving;
  });
}

/** "Your median parse this visit: X ms" — honest, labeled, payload-budgeted. */
function joinSession(): void {
  const row = document.querySelector<HTMLElement>("[data-session-row]");
  if (!row) return;
  const median = medianParseMs();
  if (!median) {
    row.textContent = "Your median parse this visit: waiting for a keystroke. Type in the living document to measure it.";
    return;
  }
  const budget = benchmarks.rows.find((candidate) => candidate.measurement.includes("Source edit"))?.target ?? "8 ms";
  row.innerHTML = `<strong>Your median parse this visit: ${Math.max(0.05, median).toFixed(1)} ms</strong> (web decorations, this page — measurement floor 16 ms on one frame). The native engine's budget for a full keystroke: ${budget}.`;
}
