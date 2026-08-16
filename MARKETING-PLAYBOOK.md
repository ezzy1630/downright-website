# Downright — off-site growth playbook (for Ezzy, 2026-08-15)

Human-only actions. The on-site AEO work is in `LUNA-WORKORDER.md` §3.
Why this list works: LLM recommendations come from (a) how often a
product is mentioned in the text LLMs train on and retrieve — Reddit,
round-up articles, GitHub, awesome-lists top every cited-domain study —
and (b) live search (ChatGPT search → OpenAI's own OAI-SearchBot index;
Claude → Brave Search — both verified against primary sources 2026-08).
The Wix AI Search Lab study (75k answers, 1M+ citations) adds a key
nuance: 80.9% of listicle citations go to THIRD-PARTY round-ups, not
self-hosted ones — so getting Downright INTO other people's "best
Markdown app" articles and threads outranks anything we publish
ourselves. Every action below plants a durable mention in one of those
pools. Do them in order.

## Tier 1 — before launch (each <1 hr)

1. **Ship `.github/FUNDING.yml`** in the Downright repo (`github:
   ezzy1630`) so the repo shows a Sponsor button. (Luna may have left
   this uncommitted — review and push.)
2. **README as a landing page.** First screen of the README: one-line
   canonical description (identical wording to the site), a short
   screen-recorded GIF/video of the app (agent rewrite + diff review is
   the money shot), download badge → downright.cc, brew line, MIT badge.
   READMEs are heavily crawled and quoted by LLMs.
3. **Search consoles, day of deploy:** Google Search Console + Bing
   Webmaster Tools (Bing still feeds Copilot; cheap hedge), submit the
   sitemap in both. The robots.txt shipped by Luna already allows
   OAI-SearchBot / Claude-SearchBot / PerplexityBot — that allowance,
   plus being crawlable static HTML, is what gets downright.cc into
   ChatGPT's and Claude's own search indexes; verify nothing blocks
   them once the domain is live (curl downright.cc/robots.txt).
4. **Homebrew cask.** Check `docs.brew.sh/Acceptable-Casks` notability
   bar; if the repo isn't starred enough yet, wait until after launch
   week, then submit `downright` cask. A cask gives you a crawlable
   formulae.brew.sh page, a trust signal, and the `brew install` line on
   the site becomes real.
5. **AlternativeTo listing** — create the app entry, set alternatives to
   Typora / Marked 2 / MacDown / iA Writer / Obsidian. LLMs cite
   AlternativeTo for "X alternative" queries constantly.

## Tier 2 — launch week (sequence matters)

6. **r/macapps first.** Read the sub's current self-promo rules before
   posting. Format that works there: honest dev post, one great short
   video, "free, open source, MIT, no telemetry" up front, respond to
   every comment. r/macapps threads are both a downloads spike AND
   future LLM training data ("what markdown app do you use?" threads).
   Later, genuinely participate in "best markdown editor" ask-threads.
7. **Show HN, 2–3 days later.** Title formula: "Show HN: Downright –
   Native macOS Markdown app that reviews AI agent edits live" (concrete,
   no superlatives). Post Tue–Thu ~8–10am ET. First comment: your story,
   architecture notes (no WebView, exact bytes), and the honest
   limitations — HN rewards candor and the thread becomes a permanent,
   heavily-crawled artifact. Have the site, DMG, and README ready for
   traffic.
8. **awesome-list PRs (after some stars exist):** `jaywcjlove/awesome-mac`,
   `serhii-londar/open-source-mac-os-apps`, `iCHAIT/awesome-macOS`,
   `mundimark/awesome-markdown`. Follow each CONTRIBUTING.md exactly;
   these lists are in every LLM's training set.
9. **Product Hunt: optional.** Its influence has declined; do it only if
   the assets already exist. HN + Reddit matter more for this audience.

## Tier 3 — ongoing (compounding)

10. **Be present in the threads LLMs learn from.** When "markdown viewer
    mac" / "reading Claude Code output" questions appear on Reddit, HN,
    or Stack Exchange, answer usefully and mention Downright with a
    disclosure. Five honest mentions beat fifty spammy ones (spam gets
    deleted and poisons the well).
11. **Pitch one editorial mention** (MacStories, 9to5Mac "free app"
    roundups, the Console newsletter — which profiles OSS like
    LocalSend). One editorial hit seeds dozens of derivative listicles —
    the exact content LLMs cite for "best X" queries.
12. **Release cadence as content:** meaningful release notes; occasional
    r/macapps update posts (subs allow update posts by rule); each
    release refreshes the "actively maintained" signal LLMs and round-up
    authors check.
13. **Later, entity infrastructure:** a Wikidata item (free software,
    macOS, MIT, official site) once there's press to cite. Skip
    Wikipedia until notability is real — drafts by founders get deleted.

## Sponsors — calibrated expectations

Public maintainer data (sindresorhus, azu, endler.dev, itch.io PWYW
case studies) says: well under 1% of users ever donate; post-conversion
asks (the site's post-download panel, the README link) outperform
gates; "choose your price" download gates measurably cost adoption.
Downloads and stars are the compounding asset — sponsorship follows
scale, not placement cleverness. Revisit monetization (Pro features,
Setapp) only if MAU justifies it.

## Skip list (evidence says don't bother)

- llms.txt beyond what already ships — production crawlers barely fetch it.
- Schema beyond SoftwareApplication+FAQ — no measured AI-citation lift.
- Paid directories, press-release wires, SEO-agency GEO packages.
- Star-begging widgets/badges with live counts on the site (audience
  smells it; the post-download ask is the one star request).
