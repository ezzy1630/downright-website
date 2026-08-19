# Building a better Markdown workflow for Claude Code

I did not set out to build a Claude Code integration. I wanted a good Mac app for reading Markdown. Then coding agents started producing the files I spent the most time reading: plans, implementation notes, audit reports, changelogs, and long README updates.

The obvious response was a plugin or chat sidebar. I decided against both. Claude Code already writes files. The useful integration point was the filesystem.

## The file is the shared protocol

A repository Markdown file has properties that a chat transcript does not. It has a stable path, normal version control, links to nearby code, and a life after the agent session ends. Any editor can open it. Any tool can change it. A teammate can review it without access to the original conversation.

That led to a simple workflow:

1. Ask Claude Code to write or update a plan in the repository.
2. Open that file in Downright.
3. Keep it visible while the implementation proceeds.
4. Review external changes as they land.
5. Commit the durable record with the code when it belongs in the project.

No extension needs to understand Claude's API. No project has to migrate into a proprietary workspace. If the agent changes, the workflow survives.

## What broke in the first version

The first useful watcher behavior was still too literal. An agent could write the same plan several times in a short burst. Comparing each new version with the immediately previous one meant the screen eventually showed only the last tiny correction. The reader could no longer see the full set of changes made since they looked away.

Downright now keeps a separate review baseline. Incoming writes accumulate against the last version the person finished reviewing. Clearing the marks advances that baseline. This sounds like a small bookkeeping choice, but it changes the product from a file refresher into a review tool.

Atomic saves exposed another weakness. Watching a file handle works until a tool replaces the file with a rename. The watcher moved to the parent directory, with inode, size, and modification checks plus a polling safety net. External writes also get a trailing quiet period so a burst settles before the document rebuilds.

## Dirty buffers forced an opinion

If Claude Code changes the file while you have an unsaved correction, there is no neutral automatic choice. Reloading destroys your edit. Saving destroys the agent's version. Ignoring the event leaves you reading stale text.

Downright refuses the shortcut. It keeps the incoming text as a pending conflict and blocks ordinary saves until you choose. Keep Mine explicitly writes the local buffer. Take Theirs applies the disk version. Both choices stay visible, and the incoming version has already been snapshotted locally.

I prefer this bit of friction. Conflict UI is annoying for a few seconds. Silent data loss is annoying forever.

## Files worth keeping open

- `CLAUDE.md`, because it states how the agent should behave in the repository.
- A plan file, because scope and acceptance criteria tend to drift during implementation.
- `README.md`, because public claims should match the product that shipped.
- `CHANGELOG.md`, because release summaries reveal what actually changed.
- Audit and migration notes, because their value comes from precise findings and unresolved risks.

Downright can open one file directly from Finder or Terminal. A folder workspace is optional. That matters here because an agent workflow should not require turning every repository into a new vault.

## A terminal loop that stays inspectable

```sh
down PLAN.md
claude
git diff -- PLAN.md
down open --line 1 --review PLAN.md
```

The `--review` form opens the file with review context. The Git diff remains useful for repository history; the live document view is useful while changes are still arriving. They solve different parts of the same problem.

## What I deliberately left out

Downright does not send prompts, manage agent permissions, or scrape a chat session. It does not need a provider login. Optional Apple Intelligence features are local, off by default, and outside the core read, edit, watch, and review path.

That boundary keeps the promise understandable: Downright reads the file you opened and notices when something else changes it. Claude Code remains responsible for coding. Git remains responsible for history. The app makes the handoff between them easier to inspect.

Try the [plan review checklist](https://downright.cc/guides/review-claude-code-plans/), read how [external writes are reconciled](https://downright.cc/guides/markdown-external-changes/), or inspect the [MIT-licensed source](https://github.com/ezzy1630/Downright).
