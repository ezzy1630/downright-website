# A practical way to review Claude Code plans

A long plan can look convincing while leaving the risky decisions vague. Clean headings help, but the real review is whether another person could follow the plan, recognize a wrong turn, and prove the result.

I keep agent plans as ordinary Markdown in the repository. They can be diffed, linked to code, read without the chat transcript, and corrected by either side. Downright is the reading surface I built for that file. The checklist below works in any editor.

## Start with the contract

Before reading the proposed steps, write down what the request actually promises. Separate five things:

- **Outcome:** what changes for the user?
- **Scope:** which repositories, files, services, or accounts are included?
- **Boundary:** what must not be changed?
- **Acceptance surface:** where will a person experience the result?
- **Proof:** what evidence would make "done" credible?

This catches a common failure early. A plan may propose a passing unit test when the request is for a working installed app. The test is useful evidence, but it is not the acceptance surface.

## Make the plan name real objects

"Update the UI" is not a step. A reviewable step names the view, state owner, command, or route it expects to change. It explains why that layer owns the behavior. Precise names make mistakes cheaper to spot before code is written.

Commands deserve the same scrutiny. A plan that says "run tests" should identify the repository's actual gate. If a release depends on signing, an appcast, or a public artifact, those checks belong in the plan too.

## Look for state transitions

Bugs hide between states more often than inside the happy path. For a document workflow, ask what happens when the file is clean, dirty, missing, renamed, restored, or rewritten twice. For a network feature, ask about loading, empty, error, retry, and stale data. For an account action, ask what happens before and after authentication.

A useful plan either covers the important transitions or states which ones are out of scope. Silence is not a decision.

## Separate reversible and consequential actions

Reading a file, building locally, and inspecting a diff are easy to undo. Publishing a release, emailing a user, deleting data, and changing a production setting are not. The plan should place a visible boundary before consequential actions and identify the exact target.

This is especially important when the agent has access to several repositories or accounts with similar names. "Deploy the site" is unsafe if staging and production are both available. The plan should say which one and why.

## Demand proof at the right layer

Match each claim to evidence:

- A parser change needs focused tests with exact inputs and outputs.
- A visual fix needs inspection of the rendered state at representative sizes.
- A macOS integration needs a fresh built or installed bundle, not only package tests.
- A published release needs the public download, version, signature, and update feed checked.
- An external submission needs a confirmation page, email, or public listing.

If the evidence cannot be collected in the current environment, the plan should call that a blocker. It should not turn "unverified" into "probably fine."

## Watch the plan while it changes

Plans often evolve during implementation. New evidence invalidates an assumption, a test exposes another state, or the repository has changed since the prompt was written. That is healthy if the revision stays visible.

Open the plan before the agent starts. When the file changes, inspect the changed words in context. Ask whether the new step follows from evidence or quietly broadens the task. In Downright, external-write marks remain relative to the last reviewed version until you clear them. You can keep local edits or accept the version on disk without losing either by accident.

## The final pass

1. Read the original request again.
2. Match every requested outcome to a completed step and a piece of evidence.
3. Check later corrections and constraints, not only the first prompt.
4. Inspect the actual diff for unrelated changes, placeholders, and stale comments.
5. List anything still blocked or unverified in plain language.

A good plan is not the longest plan. It is the smallest one that exposes the decisions, failure modes, and proof needed to finish safely.

Related: [reviewing external Markdown changes](https://downright.cc/guides/markdown-external-changes/), [the Claude Code file workflow](https://downright.cc/markdown-for-agents/claude-code/), and Downright's [document architecture](https://github.com/ezzy1630/Downright/blob/main/Docs/ARCHITECTURE.md).
