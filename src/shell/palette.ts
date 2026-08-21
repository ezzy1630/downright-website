/**
 * The ⌘K palette: a hand-rolled <dialog>, glass, fuzzy filter, full keyboard
 * nav. Actions: jump to any act, switch theme, flip to source, toggle
 * sound/motion, copy the brew command, download, changelog/themes/GitHub,
 * reset the document, and the `?` shortcut sheet. Opens under 100ms because
 * it is one dialog element and a static action list — no framework.
 */

import { themes, facts, brewCommand } from "../data/site";
import { switchTheme } from "./spill";
import { sound } from "../kernel/sound";
import { setInPageReduce } from "../kernel/switchboard";
import { doc } from "../kernel/store";
import { repaintDocumentSurfaces } from "./drop";
import { setWindowView, windowView } from "./flip";
import { springScrollTo } from "../motion/scroll";
import { toast } from "./toast";

interface Action {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: (close: () => void) => void;
}

/** Fuzzy: subsequence match with a bonus for consecutive runs. */
function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  let score = 0;
  let index = 0;
  let streak = 0;
  for (const character of needle) {
    const found = haystack.indexOf(character, index);
    if (found === -1) return 0;
    streak = found === index ? streak + 1 : 0;
    score += 1 + streak * 2 + (found === 0 ? 3 : 0);
    index = found + 1;
  }
  return score;
}

export function buildActions(): Action[] {
  const acts = [...document.querySelectorAll<HTMLElement>("[data-rail-section]")].map((section) => ({
    id: `jump:${section.id}`,
    label: `Jump to ${section.dataset.sectionLabel ?? section.id}`,
    hint: section.id,
    group: "Go",
    run: (close: () => void) => {
      close();
      springScrollTo(section.offsetTop - 72, 480);
    },
  }));

  const themeActions = themes.map((theme) => ({
    id: `theme:${theme.id}`,
    label: `Theme: ${theme.name}`,
    hint: theme.appearance,
    group: "Theme",
    run: (close: () => void) => {
      close();
      const rect = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      switchTheme(theme.id, rect);
    },
  }));

  return [
    ...acts,
    ...themeActions,
    {
      id: "flip",
      label: "Show the source",
      hint: "⌘⇧E",
      group: "Document",
      run: (close) => {
        close();
        const windowEl = document.querySelector<HTMLElement>("[data-window]");
        if (windowEl) setWindowView(windowEl, windowView(windowEl) === "source" ? "split" : "source");
      },
    },
    {
      id: "reset",
      label: "Reset document to sample text",
      hint: "sample.md",
      group: "Document",
      run: (close) => {
        close();
        doc.reset();
        repaintDocumentSurfaces();
      },
    },
    {
      id: "brew",
      label: "Copy Homebrew install command",
      hint: "brew",
      group: "Install",
      run: (close) => {
        close();
        if (!navigator.clipboard) {
          toast("<strong>Clipboard unavailable.</strong><span>Select the Homebrew command from Other install options.</span>");
          return;
        }
        void navigator.clipboard.writeText(brewCommand).catch(() => {
          toast("<strong>Copy failed.</strong><span>Select the Homebrew command from Other install options.</span>");
        });
      },
    },
    {
      id: "download",
      label: "Download Downright for macOS",
      hint: facts.artifactName || `v${facts.version}`,
      group: "Install",
      run: (close) => {
        close();
        document.querySelector<HTMLButtonElement>("[data-download]")?.click();
      },
    },
    {
      id: "sound",
      label: "Toggle interface audio",
      hint: sound.enabled ? "On" : "Off",
      group: "Preferences",
      run: () => {
        sound.setEnabled(!sound.enabled);
      },
    },
    {
      id: "motion",
      label: "Toggle reduced motion",
      hint: document.documentElement.dataset.reducedMotion === "true" ? "Reduced" : "Full",
      group: "Preferences",
      run: () => {
        setInPageReduce(document.documentElement.dataset.reducedMotion !== "true");
      },
    },
    {
      id: "shortcuts",
      label: "Keyboard shortcuts cheat sheet",
      hint: "?",
      group: "Help",
      run: (close) => {
        close();
        openShortcutSheet();
      },
    },
    {
      id: "changelog",
      label: "View changelog & releases",
      hint: `v${facts.version}`,
      group: "Site",
      run: () => {
        window.location.href = "/changelog/";
      },
    },
    {
      id: "themes-page",
      label: "Explore theme gallery",
      hint: `${themes.length} themes`,
      group: "Site",
      run: () => {
        window.location.href = "/themes/";
      },
    },
    ...(facts.repository
      ? [
          {
            id: "github",
            label: "View source on GitHub",
            hint: "github.com",
            group: "Site",
            run: () => {
              window.open(facts.repository, "_blank", "noreferrer");
            },
          },
        ]
      : []),
  ];
}

export function openShortcutSheet(): void {
  const sheet = document.querySelector<HTMLDialogElement>("[data-shortcut-sheet]");
  if (!sheet) return;
  sheet.showModal();
}

export function initPalette(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-command-palette], [data-palette-dialog]");
  if (!dialog) return;
  const input = dialog.querySelector<HTMLInputElement>("[data-palette-input]");
  const list = dialog.querySelector<HTMLElement>("[data-palette-list]");
  if (!input || !list) return;

  let actions: Action[] = [];
  let filtered: Action[] = [];
  let cursor = 0;

  const renderList = (): void => {
    list.replaceChildren();
    filtered.forEach((action, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = index === cursor ? "palette-row is-cursor" : "palette-row";
      button.dataset.paletteRow = String(index);
      button.innerHTML = `<span>${action.label}</span>${action.hint ? `<kbd>${action.hint}</kbd>` : ""}`;
      button.addEventListener("click", () => {
        sound.tick();
        action.run(() => dialog.close());
      });
      list.append(button);
    });
  };

  const refilter = (): void => {
    const query = input.value.trim();
    if (!query) {
      filtered = actions;
    } else {
      filtered = actions
        .map((action) => ({ action, score: fuzzyScore(query, `${action.label} ${action.group}`) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.action);
    }
    cursor = 0;
    renderList();
  };

  const open = (): void => {
    if (dialog.open) return;
    actions = buildActions();
    filtered = actions;
    input.value = "";
    cursor = 0;
    dialog.showModal();
    sound.whoosh();
    refilter();
    input.focus();
  };

  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) {
        dialog.close();
      } else {
        open();
      }
    }
    if (event.key === "?" && !dialog.open && !(event.target as HTMLElement).closest("input, textarea, [contenteditable]")) {
      openShortcutSheet();
    }
  });

  input.addEventListener("input", refilter);

  // Close when clicking outside of the dialog box (on the backdrop)
  let pointerDownOutside = false;
  dialog.addEventListener("pointerdown", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      pointerDownOutside = !isInside;
    } else {
      pointerDownOutside = false;
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && pointerDownOutside) {
      const rect = dialog.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!isInside) {
        dialog.close();
      }
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length > 0) {
        cursor = Math.min(filtered.length - 1, Math.max(0, cursor + (event.key === "ArrowDown" ? 1 : -1)));
        sound.thock();
        renderList();
        list.querySelector(".is-cursor")?.scrollIntoView({ block: "nearest" });
      }
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[cursor]) {
        sound.tick();
        filtered[cursor].run(() => dialog.close());
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });

  // Shortcut sheet backdrop click & escape dismiss
  const sheet = document.querySelector<HTMLDialogElement>("[data-shortcut-sheet]");
  if (sheet) {
    let sheetPointerOutside = false;
    sheet.addEventListener("pointerdown", (event) => {
      if (event.target === sheet) {
        const rect = sheet.getBoundingClientRect();
        const isInside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        sheetPointerOutside = !isInside;
      } else {
        sheetPointerOutside = false;
      }
    });

    sheet.addEventListener("click", (event) => {
      if (event.target === sheet && sheetPointerOutside) {
        const rect = sheet.getBoundingClientRect();
        const isInside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!isInside) {
          sheet.close();
        }
      }
    });
  }
}
