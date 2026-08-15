/**
 * System reach: a Finder-styled surface of .md file cards with real verlet
 * physics — flick, collide, settle with character, sleep at rest. Space
 * Quick-Looks the focused card (glass overlay, Esc/click paths), and
 * dragging a card onto any document window makes it the living document.
 * The terminal types once, on visibility.
 */

import { ticker } from "../kernel/ticker";
import { PointerTracker } from "../kernel/pointer";
import { reducedMotion } from "../kernel/switchboard";
import { renderSampleMarkdown } from "../data/site";
import agentDumpSource from "../data/agent-dump.md?raw";
import { doc } from "../kernel/store";
import { repaintDocumentSurfaces } from "../shell/drop";
import { sound } from "../kernel/sound";

interface FileCard {
  element: HTMLElement;
  name: string;
  source: string;
  x: number;
  y: number;
  px: number;
  py: number;
  resting: boolean;
}

const GRAVITY = 1400;
const REST_DAMPING = 0.86;
const BOUNCE = 0.42;
const CARD_FILENAMES: [name: string, key: string][] = [
  ["sample.md", "sample"],
  ["README.md", "readme"],
  ["session-8f3c.md", "agent"],
  ["architecture.md", "architecture"],
];

const SOURCES: Record<string, () => string> = {
  sample: () => doc.current.text,
  agent: () => agentDumpSource,
  readme: () =>
    "# Downright\n\nA native Markdown reader and editor for macOS. Exact bytes in, exact bytes out.\n\n- [x] No WebView\n- [x] No account\n- [ ] Your file here\n",
  architecture: () =>
    "# Architecture\n\nRaw text is the only source of truth. One adaptive surface renders Read, Live, and Source Focus without rewriting a byte.\n",
};

export function initReach(): void {
  initVerlet();
  initTerminal();
}

function initVerlet(): void {
  // The cards live in the Finder surface's field (the chrome bar sits above
  // it). Bounds, pointer geometry, and layout all measure the field.
  const field = document.querySelector<HTMLElement>("[data-file-field]");
  const surfaceElement = field ?? document.querySelector<HTMLElement>("[data-file-surface]");
  if (!surfaceElement) return;
  // Local non-null binding so closures keep the narrowing.
  const surface = surfaceElement;
  const quickLook = document.querySelector<HTMLElement>("[data-quick-look]");

  const cards: FileCard[] = [];
  const tracker = new PointerTracker();
  let dragging: FileCard | null = null;
  let active = false;
  let settled = true;

  CARD_FILENAMES.forEach(([name, key], index) => {
    const element = document.createElement("div");
    element.className = "file-card";
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `${name} — press Space to Quick Look`);
    element.dataset.fileCard = name;
    element.innerHTML = `<span class="file-card__kind" aria-hidden="true">MD</span><span class="file-card__name">${name}</span>`;
    surface.append(element);
    const x = surface.clientWidth * (0.14 + index * 0.24);
    const y = surface.clientHeight * (0.3 + (index % 2) * 0.22);
    cards.push({ element, name, source: key, x, y, px: x, py: y, resting: false });
    position(cards[cards.length - 1]);
  });

  function position(card: FileCard): void {
    card.element.style.translate = `${Math.round(card.x - card.element.offsetWidth / 2)}px ${Math.round(card.y - card.element.offsetHeight / 2)}px`;
  }

  function wake(): void {
    if (active) return;
    active = true;
    ticker.add((dt) => step(dt));
  }

  function step(dt: number): boolean {
    const floor = surface.clientHeight - 30;
    settled = true;
    for (const card of cards) {
      if (card === dragging) continue;
      const vx = (card.x - card.px) * REST_DAMPING;
      const vy = (card.y - card.py) * REST_DAMPING;
      card.px = card.x;
      card.py = card.y;
      card.x += vx;
      card.y += vy + GRAVITY * dt * dt;

      // Floor and walls, with a little character on the bounce.
      if (card.y > floor) {
        card.y = floor;
        card.py = card.y + vy * BOUNCE;
      }
      const halfWidth = card.element.offsetWidth / 2;
      if (card.x < halfWidth) {
        card.x = halfWidth;
        card.px = card.x + vx * BOUNCE;
      }
      if (card.x > surface.clientWidth - halfWidth) {
        card.x = surface.clientWidth - halfWidth;
        card.px = card.x + vx * BOUNCE;
      }

      const speed = Math.hypot(card.x - card.px, card.y - card.py);
      if (speed > 0.4) settled = false;
      else if (!card.resting && speed <= 0.4) card.resting = true;
      position(card);
    }

    // Card-card separation: circles at half-extent; gentle, not billiards.
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const a = cards[i];
        const b = cards[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1;
        const minDistance = (Math.min(a.element.offsetWidth, b.element.offsetWidth) / 2) * 1.15;
        if (distance < minDistance && distance > 0.01) {
          const push = (minDistance - distance) / 2;
          a.x -= (dx / distance) * push;
          a.y -= (dy / distance) * push * 0.4;
          b.x += (dx / distance) * push;
          b.y += (dy / distance) * push * 0.4;
          settled = false;
        }
      }
    }
    return !settled;
  }

  if (reducedMotion()) {
    // Cards lay where dealt; QL and drag-to-document still fully work.
    for (const card of cards) position(card);
  } else {
    wake();
    window.addEventListener(
      "resize",
      () => {
        for (const card of cards) {
          card.x = Math.min(card.x, surface.clientWidth - 40);
          card.y = Math.min(card.y, surface.clientHeight - 30);
          position(card);
        }
        wake();
      },
      { passive: true },
    );
  }

  // Drag: position follows the pointer; release hands off real velocity.
  surface.addEventListener("pointerdown", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-file-card]");
    if (!target) return;
    const card = cards.find((candidate) => candidate.element === target);
    if (!card) return;
    dragging = card;
    card.element.setPointerCapture(event.pointerId);
    card.element.classList.add("is-dragged");
    const rect = surface.getBoundingClientRect();
    card.x = event.clientX - rect.left;
    card.y = event.clientY - rect.top;
    card.px = card.x;
    card.py = card.y;
    position(card);
    tracker.update(event);
  });
  surface.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const rect = surface.getBoundingClientRect();
    const velocity = tracker.update(event);
    dragging.x = event.clientX - rect.left;
    dragging.y = event.clientY - rect.top;
    dragging.px = dragging.x - velocity.x / 60;
    dragging.py = dragging.y - velocity.y / 60;
    position(dragging);
    wake();
  });
  const drop = (event: PointerEvent): void => {
    if (!dragging) return;
    const card = dragging;
    dragging = null;
    card.element.classList.remove("is-dragged");
    const velocity = tracker.update(event);
    card.px = card.x - velocity.x / 60;
    card.py = card.y - velocity.y / 60;
    wake();
    // Dropped on a document window: the file becomes the living document.
    const overWindow = (event.target as Element | null)?.closest("[data-window], [data-static-document]");
    if (overWindow) {
      doc.replaceFile(sourceFor(card), card.name);
      repaintDocumentSurfaces();
      sound.tick();
    }
  };
  surface.addEventListener("pointerup", drop);
  surface.addEventListener("pointercancel", drop);

  // Space Quick-Looks the focused card; Esc and click close.
  surface.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    const card = cards.find((candidate) => candidate.element === target);
    if (!card) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      openQuickLook(card);
    }
  });
  surface.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-file-card]");
    target?.setAttribute("title", "Space to Quick Look · drag onto the document");
  });

  function sourceFor(card: FileCard): string {
    const loader = SOURCES[card.source];
    return loader ? loader() : "";
  }

  function openQuickLook(card: FileCard): void {
    if (!quickLook) return;
    const body = quickLook.querySelector<HTMLElement>("[data-quick-look-body]");
    if (!body) return;
    body.innerHTML = renderSampleMarkdown(sourceFor(card));
    quickLook.querySelector<HTMLElement>("[data-quick-look-title]")!.textContent = card.name;
    quickLook.classList.add("is-open");
    quickLook.querySelector<HTMLButtonElement>("[data-quick-look-close]")?.focus();
    sound.whoosh();
  }
  quickLook?.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("[data-quick-look-close]") || event.target === quickLook) {
      quickLook.classList.remove("is-open");
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") quickLook?.classList.remove("is-open");
  });
}

const TERMINAL_LINES: [prompt: string, output: string][] = [
  ["down README.md", "README.md  opened in Downright"],
  ["printf '# Draft' | down", "stdin  rendered without changing the source"],
  ["down outline --json", '[{"title":"Downright renderer showcase","level":1}]'],
  ["down check --target github", "target github  compatible"],
];

function initTerminal(): void {
  const terminal = document.querySelector<HTMLElement>("[data-terminal]");
  if (!terminal) return;
  const code = terminal.querySelector<HTMLElement>("[data-terminal-body]");
  if (!code) return;

  const render = (): void => {
    const fragment = document.createDocumentFragment();
    for (const [command, output] of TERMINAL_LINES) {
      const prompt = document.createElement("span");
      prompt.className = "terminal-prompt";
      prompt.textContent = "$ ";
      const typed = document.createElement("span");
      typed.className = "terminal-command";
      typed.textContent = command;
      const line = document.createElement("div");
      line.append(prompt, typed);
      const result = document.createElement("div");
      result.className = "terminal-output";
      result.textContent = output;
      fragment.append(line, result);
    }
    code.replaceChildren(fragment);
  };

  if (reducedMotion()) {
    render();
    return;
  }

  let typed = false;
  const typeLine = (index: number): void => {
    if (index >= TERMINAL_LINES.length) return;
    const [command, output] = TERMINAL_LINES[index];
    const line = document.createElement("div");
    const prompt = document.createElement("span");
    prompt.className = "terminal-prompt";
    prompt.textContent = "$ ";
    const typedEl = document.createElement("span");
    typedEl.className = "terminal-command";
    line.append(prompt, typedEl);
    code.append(line);
    let character = 0;
    const step = (): void => {
      character += 1;
      typedEl.textContent = command.slice(0, character);
      if (character < command.length) {
        window.setTimeout(step, 34 + Math.random() * 40);
        return;
      }
      const result = document.createElement("div");
      result.className = "terminal-output";
      result.textContent = output;
      code.append(result);
      window.setTimeout(() => typeLine(index + 1), 420);
    };
    step();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || typed) return;
      typed = true;
      observer.disconnect();
      typeLine(0);
    },
    { threshold: 0.4 },
  );
  observer.observe(terminal);
}
