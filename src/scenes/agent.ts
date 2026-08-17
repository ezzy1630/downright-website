/**
 * The agent visit — the mid-page climax. Performs on EVERY entry (the first
 * visit full-length, replays on a quicker cadence): the living document
 * receives an external write,
 * words rewrite in place with word-level marks streaming in, the reading
 * position holds, a glass change toast lands, and marks dim after 1.5s of
 * dwell — exactly like the app. If the visitor typed in the hero, the buffer
 * is dirty and they get the real thing: a non-modal conflict bar with
 * Review · Keep Mine · Take Theirs, all three genuinely working. The page's
 * one contextual CTA appears only after the moment completes.
 */

import { doc } from "../kernel/store";
import { flyPinnedRect, pinRect } from "../kernel/fly";
import { reducedMotion } from "../kernel/switchboard";
import { diffWords, summarizeDiff, type DiffToken } from "../kernel/worddiff";
import { renderSampleMarkdown } from "../data/site";
import type { RailController } from "./rail";
import { toast } from "../shell/toast";
import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";

const SESSION_KEY = "downright-agent-visited";
const DWELL_MS = 1500;

/** The rewrite the agent performs — phrasal edits on stable sample lines. */
const REWRITES: { find: RegExp; replace: string }[] = [
  { find: /The document map draws from this same structure, so every altitude has a floor to stand on\./, replace: "The document map follows the same block index, so every reading level keeps its anchor." },
  { find: /Native: prose, source, state, and media in one surface\./, replace: "Native: prose, source, state, and media remain one review surface." },
  { find: /The handoff stays source-first while the rendered surface stays native\./, replace: "The handoff stays source-first while the rendered surface remains native." },
];

const ADDED_SECTION = "\n\n> [!NOTE]\n> Agents rewrite faster than anyone reads. Marks and review keep the file yours.\n";

function composeTheirs(mine: string): string {
  let theirs = mine;
  for (const { find, replace } of REWRITES) theirs = theirs.replace(find, replace);
  if (theirs === mine) {
    // The visitor replaced the document wholesale; the agent appends instead.
    theirs = `${mine}${ADDED_SECTION}`;
  } else {
    theirs += ADDED_SECTION;
  }
  return theirs;
}

export function initAgent(rail: RailController | null): void {
  const stage = document.querySelector<HTMLElement>("[data-agent-stage]");
  if (!stage) return;
  const documentHost = stage.querySelector<HTMLElement>("[data-agent-document]");
  const toastEl = stage.querySelector<HTMLElement>("[data-change-toast]");
  const conflictBar = stage.querySelector<HTMLElement>("[data-conflict-bar]");
  const contextual = document.querySelector<HTMLElement>("[data-contextual-cta]");
  const reviewPanel = stage.querySelector<HTMLElement>("[data-review-panel]");
  if (!documentHost || !toastEl || !conflictBar) return;

  // The rewrite lands in the traveling window's read layer — the same
  // document every act shows. Resolve lazily: the window teleports in.
  const readLayer = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-document-read]");
  const surface = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-document-read] [data-static-document]");

  let triggered = false;
  let performing = false;
  let visit = 0;

  const revealContextual = (): void => {
    // The page's one contextual ask, earned only after the moment completes.
    contextual?.removeAttribute("hidden");
    contextual?.classList.add("is-earned");
  };

  const finish = (): void => {
    if (rail) rail.markChanged();
    window.setTimeout(revealContextual, 600);
  };

  /** The window wears the external write: accent state, pulsing bar dot,
   *  a status line that says what is happening. Worn from the first mark
   *  until the decision (or the dwell) settles it. */
  const wearWriteState = (on: boolean): void => {
    const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
    if (!windowEl) return;
    if (on) windowEl.dataset.chrome = "agent";
    else if (windowEl.dataset.chrome === "agent") delete windowEl.dataset.chrome;
    windowEl.querySelector(".app-window__write-dot")?.toggleAttribute("hidden", !on);
    windowEl.querySelector("[data-write-state]")?.toggleAttribute("hidden", !on);
  };

  const fire = (): void => {
    performing = true;
    visit += 1;
    // Replays compose on the current text with any previous visit's note
    // stripped, so the added block never accumulates across performances.
    const mine = doc.current.text.split(ADDED_SECTION).join("");
    const theirs = composeTheirs(mine);
    const tokens = diffWords(mine, theirs);
    const summary = summarizeDiff(tokens);
    // First visit full-length; replays run a quicker cadence.
    const pace = visit > 1 ? 0.55 : 1;
    const dwell = visit > 1 ? 800 : DWELL_MS;
    wearWriteState(true);

    if (reducedMotion()) {
      doc.stageExternalWrite(theirs);
      doc.markStreamed();
      renderWithMarks(surface(), theirs, tokens, true);
      toastEl.querySelector("[data-change-summary]")!.textContent = `${summary.rewritten} rewritten · ${summary.added} added`;
      toastEl.classList.add("is-visible");
      if (doc.current.dirty) {
        conflictBar.removeAttribute("hidden");
        conflictBar.classList.add("is-open");
      } else {
        wearWriteState(false);
      }
      finish();
      performing = false;
      return;
    }

    // Streaming rewrite: rendered words carry word-level marks that surface
    // on a per-word cadence; the reading position never moves. Arm the store
    // so the traveling window stops repainting under the rewrite.
    doc.beginStreaming();
    const scroller = readLayer();
    const scrollAnchor = scroller?.scrollTop ?? 0;
    renderWithMarks(surface(), theirs, tokens, false);
    scroller?.scrollTo(0, scrollAnchor);

    const marks = [...(surface()?.querySelectorAll<HTMLElement>("mark[data-change-kind]") ?? [])];
    const perWord = Math.max(12, (2200 * pace) / Math.max(1, marks.length));
    const lead = 300 * pace;
    marks.forEach((changeMark, index) => {
      window.setTimeout(() => changeMark.classList.add("is-live"), lead + index * perWord);
    });
    const streamEnd = lead + marks.length * perWord + 200;

    window.setTimeout(() => {
      toastEl.querySelector("[data-change-summary]")!.textContent = `${summary.rewritten} rewritten · ${summary.added} added`;
      toastEl.classList.add("is-visible");
      // The rewrite lands in the store; the read layer holds the marks until
      // the conflict resolves or the dwell elapses, exactly like the app.
      doc.stageExternalWrite(theirs);
      window.setTimeout(() => documentHost.classList.add("marks-dimmed"), dwell);
      if (doc.current.dirty) {
        // The unforgettable branch: they typed, the buffer is dirty.
        conflictBar.removeAttribute("hidden");
        conflictBar.classList.add("is-open");
        conflictBar.querySelector<HTMLButtonElement>("[data-conflict-focus]")?.focus();
      } else {
        window.setTimeout(() => {
          doc.markStreamed();
          wearWriteState(false);
          finish();
          performing = false;
        }, dwell + 400);
      }
    }, streamEnd);
  };

  /**
   * Arming is redundant on purpose (§18.4 "fires exactly once"): an
   * IntersectionObserver on the document host fires the moment the document
   * is ≥50% visible, AND a geometry check on the shared scroll read is the
   * fallback for engines or scroll jumps where the observer misses. Both
   * funnel into trigger(), which is idempotent.
   */
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) trigger();
        // The act left: re-arm. Every entry performs — the window never
        // sits plain. (A performance already in flight finishes untouched;
        // the next entry after it fires fresh.)
        else if (!entry.isIntersecting && entry.intersectionRatio === 0) triggered = false;
      }
    },
    { threshold: [0, 0.5] },
  );
  observer.observe(documentHost);

  /** The document host must be ≥50% visible before the moment lands. */
  const hostVisible = (): boolean => {
    const rect = documentHost.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    return visibleHeight >= rect.height * 0.5;
  };

  function trigger(): void {
    if (triggered || performing) return;
    triggered = true;
    // Kept for the harness's session marker; the visit itself no longer
    // gates on it — every entry performs.
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* this visit only */
    }
    stage!.dataset.agentReplay = String(visit + 1);
    fire();
  }
  const onScroll = (): void => {
    if (hostVisible()) trigger();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  // Late-binding for hash jumps that land before listeners attach.
  window.addEventListener("load", onScroll);
  // One rAF sweep covers deep-link jumps that land before any scroll event.
  requestAnimationFrame(onScroll);

  // Conflict bar: all three genuinely working.
  const resolve = (action: "mine" | "theirs"): void => {
    const revision = doc.current.revision;
    if (!revision) return;
    if (action === "mine") {
      doc.resolveMine();
      repaintHost(surface());
      toast("<strong>Your buffer kept.</strong><span>The agent's words stay marked, never applied.</span>");
    } else {
      doc.resolveTheirs();
      repaintHost(surface());
      toast("<strong>External write accepted.</strong><span>The rendered document is current.</span>");
    }
    conflictBar.classList.remove("is-open");
    conflictBar.setAttribute("hidden", "");
    reviewPanel?.classList.remove("is-open");
    documentHost.classList.add("marks-dimmed");
    wearWriteState(false);
    performing = false;
    // The decision lands as a stamp: the window takes it with one
    // squash-settle, so the climax ends on a beat instead of a whisper.
    if (!reducedMotion()) {
      const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
      if (windowEl) {
        const stamp = new SpringScalar(0.985, MOTION.durations.deliberate, 0.5);
        stamp.setTarget(1);
        ticker.add((dt) => {
          const moving = stamp.advance(dt);
          windowEl.style.setProperty("--stamp-scale", stamp.value.toFixed(4));
          if (!moving) windowEl.style.removeProperty("--stamp-scale");
          return moving;
        });
      }
    }
    finish();
  };

  conflictBar.querySelectorAll<HTMLButtonElement>("[data-conflict-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.conflictAction;
      if (action === "review") openReview(reviewPanel, resolve);
      else if (action === "mine" || action === "theirs") resolve(action);
    });
  });
}

function repaintHost(surface: HTMLElement | null): void {
  if (surface) surface.innerHTML = renderSampleMarkdown(doc.current.text);
}

/**
 * Renders `theirs` with word-level change marks. Modified words carry
 * changeModified; words that only exist in theirs carry changeAdded.
 */
function renderWithMarks(surface: HTMLElement | null, theirs: string, tokens: DiffToken[], staticMarks: boolean): void {
  if (!surface) return;
  surface.innerHTML = renderSampleMarkdown(theirs);

  // Apply marks by text-matching the rendered words: the renderer escapes
  // everything, so we walk text nodes and wrap changed phrases.
  const changed = tokens.filter((token) => token.kind !== "equal");
  if (!changed.length) return;
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }
  for (const token of changed) {
    const phrase = token.text.trim();
    if (phrase.length < 4) continue;
    const kind = token.kind === "removed" ? "changeModified" : "changeAdded";
    for (const textNode of textNodes) {
      const content = textNode.textContent ?? "";
      const index = content.indexOf(phrase);
      if (index === -1) continue;
      const mark = document.createElement("mark");
      mark.dataset.changeKind = kind;
      mark.className = kind === "changeModified" ? "change-mark change-modified" : "change-mark change-added";
      if (staticMarks) mark.classList.add("is-live");
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + phrase.length);
      range.surroundContents(mark);
      break;
    }
  }
}

function openReview(panel: HTMLElement | null, resolve: (action: "mine" | "theirs") => void): void {
  if (!panel) return;
  const revision = doc.current.revision;
  if (!revision) return;
  const tokens = diffWords(revision.mine, revision.theirs);
  const mineHtml = tokens.map((token) => (token.kind === "added" ? "" : escapeHtml(token.text))).join("");
  const theirsHtml = tokens
    .map((token) => (token.kind === "removed" ? "" : escapeHtml(token.text)))
    .join("");
  panel.innerHTML = `
    <div class="review-diff" role="dialog" aria-label="Review the external write">
      <header><strong>Review</strong><span>word diff · yours | theirs</span>
        <button type="button" data-review-close aria-label="Close review">Esc</button></header>
      <div class="review-diff__panes">
        <pre aria-label="Your words">${mineHtml}</pre>
        <pre aria-label="The agent's words">${theirsHtml}</pre>
      </div>
      <footer>
        <button type="button" data-review-keep>Keep Mine</button>
        <button type="button" data-review-take>Take Theirs</button>
      </footer>
    </div>`;
  panel.classList.add("is-open");
  // The review is born from its Review button — the same pinned-rect flight
  // the Quick Look sheet gets, so every summons on this page grows from the
  // control that made it.
  const dialog = panel.querySelector<HTMLElement>(".review-diff");
  const trigger = document.querySelector<HTMLElement>("[data-conflict-focus]");
  if (dialog && trigger && document.documentElement.dataset.reducedMotion !== "true") {
    const to = dialog.getBoundingClientRect();
    const from = trigger.getBoundingClientRect();
    pinRect(dialog, from);
    flyPinnedRect(dialog, from, to);
  }
  panel.querySelector<HTMLButtonElement>("[data-review-close]")?.addEventListener("click", () => panel.classList.remove("is-open"));
  panel.querySelector<HTMLButtonElement>("[data-review-keep]")?.addEventListener("click", () => resolve("mine"));
  panel.querySelector<HTMLButtonElement>("[data-review-take]")?.addEventListener("click", () => resolve("theirs"));
  panel.querySelector<HTMLButtonElement>("[data-review-close]")?.focus();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
