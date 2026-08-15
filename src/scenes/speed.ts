/**
 * Speed: native benchmarks with budgets beside them, drawn once on the
 * `deliberate` curve (log scale) — every number traces to the payload. The
 * reader's own session joins the table: the editor's median measured parse
 * this visit, beside the native engine's stated keystroke budget.
 */

import { reducedMotion } from "../kernel/switchboard";
import { medianParseMs } from "../editor/stats";
import { benchmarks } from "../data/site";

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
          bar.style.transition = "width 0.32s cubic-bezier(0.3, 0.3, 0.2, 1)";
          bar.style.width = `${width}%`;
        });
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

/** "Your median parse this visit: X ms" — honest, labeled, payload-budgeted. */
function joinSession(): void {
  const row = document.querySelector<HTMLElement>("[data-session-row]");
  if (!row) return;
  const median = medianParseMs();
  if (!median) {
    row.textContent = "Type in the hero document — your measured parse joins this table.";
    return;
  }
  const budget = benchmarks.rows.find((candidate) => candidate.measurement.includes("Source edit"))?.target ?? "8 ms";
  row.innerHTML = `<strong>Your median parse this visit: ${Math.max(0.05, median).toFixed(1)} ms</strong> (web decorations, this page — measurement floor 16 ms on one frame). The native engine's budget for a full keystroke: ${budget}.`;
}
