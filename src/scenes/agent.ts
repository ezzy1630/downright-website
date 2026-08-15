/**
 * The agent visit — the mid-page climax. Arms on entry and fires exactly
 * once per session, ever: the living document receives an external write,
 * words rewrite in place with word-level marks streaming in, the reading
 * position holds, a glass change toast lands, and marks dim after 1.5s of
 * dwell — exactly like the app. If the visitor typed in the hero, the buffer
 * is dirty and they get the real thing: a non-modal conflict bar with
 * Review · Keep Mine · Take Theirs, all three genuinely working. The page's
 * one contextual CTA appears only after the moment completes.
 */

import { doc } from "../kernel/store";
import { reducedMotion } from "../kernel/switchboard";
import { diffWords, summarizeDiff, type DiffToken } from "../kernel/worddiff";
import { renderSampleMarkdown } from "../data/site";
import type { RailController } from "./rail";
import { toast } from "../shell/toast";

const SESSION_KEY = "downright-agent-visited";
const DWELL_MS = 1500;

/** The rewrite the agent performs — phrasal edits on stable sample lines. */
const REWRITES: { find: RegExp; replace: string }[] = [
  { find: /This lower shelf gives the document map real structure without competing with the proof above\./, replace: "The document map draws from this same structure, so every altitude has a floor to stand on." },
  { find: /prose \+ source \+ state \+ media/, replace: "prose, source, state, and media in one surface" },
  { find: /stays the source of truth while the rendered surface stays native/, replace: "stays authoritative while the rendered surface stays native" },
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

  let fired = false;
  let triggered = false;
  try {
    fired = sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    fired = false; // storage blocked; the moment still fires this visit
  }

  const revealContextual = (): void => {
    // The page's one contextual ask, earned only after the moment completes.
    contextual?.removeAttribute("hidden");
    contextual?.classList.add("is-earned");
  };

  const finish = (): void => {
    if (rail) rail.markChanged();
    window.setTimeout(revealContextual, 600);
  };

  const fire = (): void => {
    const mine = doc.current.text;
    const theirs = composeTheirs(mine);
    const tokens = diffWords(mine, theirs);
    const summary = summarizeDiff(tokens);

    if (reducedMotion()) {
      doc.stageExternalWrite(theirs);
      doc.markStreamed();
      renderWithMarks(surface(), theirs, tokens, true);
      toastEl.querySelector("[data-change-summary]")!.textContent = `${summary.rewritten} rewritten · ${summary.added} added`;
      toastEl.classList.add("is-visible");
      if (doc.current.dirty) {
        conflictBar.removeAttribute("hidden");
        conflictBar.classList.add("is-open");
      }
      finish();
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
    const perWord = Math.max(12, 2200 / Math.max(1, marks.length));
    marks.forEach((changeMark, index) => {
      window.setTimeout(() => changeMark.classList.add("is-live"), 300 + index * perWord);
    });
    const streamEnd = 300 + marks.length * perWord + 200;

    window.setTimeout(() => {
      toastEl.querySelector("[data-change-summary]")!.textContent = `${summary.rewritten} rewritten · ${summary.added} added`;
      toastEl.classList.add("is-visible");
      // The rewrite lands in the store; the read layer holds the marks until
      // the conflict resolves or the dwell elapses, exactly like the app.
      doc.stageExternalWrite(theirs);
      window.setTimeout(() => documentHost.classList.add("marks-dimmed"), DWELL_MS);
      if (doc.current.dirty) {
        // The unforgettable branch: they typed, the buffer is dirty.
        conflictBar.removeAttribute("hidden");
        conflictBar.classList.add("is-open");
        conflictBar.querySelector<HTMLButtonElement>("[data-conflict-focus]")?.focus();
      } else {
        window.setTimeout(() => {
          doc.markStreamed();
          finish();
        }, DWELL_MS + 400);
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
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) trigger();
    },
    { threshold: [0.5] },
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
    if (triggered) return;
    triggered = true;
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    window.removeEventListener("load", onScroll);
    try {
      sessionStorage.setItem(SESSION_KEY, "1"); // once per session, ever
    } catch {
      /* this visit only */
    }
    if (fired) {
      // Already seen this session: hold the final state, no replay.
      stage!.dataset.agentReplay = "held";
      revealContextual();
      return;
    }
    fired = true;
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
  panel.querySelector<HTMLButtonElement>("[data-review-close]")?.addEventListener("click", () => panel.classList.remove("is-open"));
  panel.querySelector<HTMLButtonElement>("[data-review-keep]")?.addEventListener("click", () => resolve("mine"));
  panel.querySelector<HTMLButtonElement>("[data-review-take]")?.addEventListener("click", () => resolve("theirs"));
  panel.querySelector<HTMLButtonElement>("[data-review-close]")?.focus();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
