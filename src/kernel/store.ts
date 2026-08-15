/**
 * The living document: one shared sample.md state that every scene reads and
 * writes. Edits made in the hero are visible in the render, zoom, and agent
 * acts; the agent visit stages its rewrite here; reset restores the payload.
 */

export interface DocRevision {
  /** Text as the visitor last had it before an external write landed. */
  mine: string;
  /** The external write's text. */
  theirs: string;
}

type Listener = (state: DocState) => void;

export interface DocState {
  text: string;
  dirty: boolean;
  fileName: string;
  agent: "idle" | "streaming" | "conflict" | "resolved-mine" | "resolved-theirs";
  revision: DocRevision | null;
}

import { sampleMarkdown as CLEAN_TEXT } from "../data/site";

class DocumentStore {
  private state: DocState = {
    text: CLEAN_TEXT,
    dirty: false,
    fileName: "sample.md",
    agent: "idle",
    revision: null,
  };
  private readonly listeners = new Set<Listener>();

  get current(): DocState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private commit(patch: Partial<DocState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  /** A visitor edit (hero typing, mobile "insert an edit" chip). */
  edit(text: string): void {
    if (text === this.state.text) return;
    this.commit({ text, dirty: true });
  }

  /** Arm the streaming state so scenes stop repainting the read layer while
   *  the rewrite is mid-flight (the agent owns it until it resolves). */
  beginStreaming(): void {
    if (this.state.agent === "idle") this.commit({ agent: "streaming" });
  }

  /** The external write always becomes the document; a dirty buffer only
   *  decides whether it lands as a conflict (reviewable) or a plain apply. */
  stageExternalWrite(theirs: string): void {
    this.commit({
      revision: { mine: this.state.text, theirs },
      agent: this.state.dirty ? "conflict" : "streaming",
      text: theirs,
    });
  }

  markStreamed(): void {
    if (this.state.agent === "streaming") this.commit({ agent: "resolved-theirs" });
  }

  resolveMine(): void {
    const revision = this.state.revision;
    if (!revision) return;
    this.commit({ text: revision.mine, agent: "resolved-mine", dirty: true });
  }

  resolveTheirs(): void {
    const revision = this.state.revision;
    if (!revision) return;
    this.commit({ text: revision.theirs, agent: "resolved-theirs", dirty: false });
  }

  /** A dropped/pasted file replaces the living document everywhere. */
  replaceFile(text: string, fileName: string): void {
    this.commit({ text, fileName, dirty: false, agent: "idle", revision: null });
  }

  reset(): void {
    this.commit({
      text: CLEAN_TEXT,
      fileName: "sample.md",
      dirty: false,
      agent: "idle",
      revision: null,
    });
  }
}

export const doc = new DocumentStore();
