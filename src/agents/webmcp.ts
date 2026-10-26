import { pageMeta } from "../data/seo";
import { brewCommand, curlCommand, entityDescription, facts, npmCommand } from "../data/site";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

type Tool = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: "string"; description: string; maxLength?: number; enum?: string[] }>;
    required?: string[];
    additionalProperties: false;
  };
  annotations: { readOnlyHint: true };
  execute: (input: unknown, options: { signal: AbortSignal }) => Promise<ToolResult>;
};

// The subset we use, including older Chrome's synchronous registration.
export interface ModelContext {
  registerTool(tool: Tool): void | Promise<void>;
}

declare global {
  interface Document { readonly modelContext?: ModelContext }
  interface Navigator { readonly modelContext?: ModelContext }
}

const docs = Object.values(pageMeta).map(({ title, description, markdownPath }) => ({
  title,
  description,
  markdownPath,
  path: markdownPath === "/index.md" ? "/" : `${markdownPath.slice(0, -3)}/`,
}));

const result = (value: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(value) }] });
const error = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });
const absolute = (path: string): string => new URL(path, window.location.origin).href;
const noInput = { type: "object", properties: {}, additionalProperties: false } satisfies Tool["inputSchema"];

function stringParameter(input: unknown, name: string): string | undefined {
  if (typeof input !== "object" || input === null || !(name in input)) return;
  const value: unknown = Reflect.get(input, name);
  return typeof value === "string" ? value.trim() : undefined;
}

const tools: Tool[] = [
  {
    name: "get_downright_info",
    description: "Get published product facts about Downright, the free native Markdown editor and viewer for macOS, with source provenance and documentation links.",
    inputSchema: noInput,
    annotations: { readOnlyHint: true },
    execute: async () => result({
      name: "Downright",
      description: entityDescription,
      operatingSystem: `macOS ${facts.minimumMacOS}+`,
      license: facts.license,
      repository: facts.repository,
      supportedExtensions: facts.supportedExtensions,
      website: absolute("/"),
      documentation: absolute("/llms.txt"),
      knownGaps: absolute("/known-gaps/"),
      publishedSnapshot: { version: facts.version, sourceCommit: facts.sourceCommit, generatedAt: facts.generatedAt },
    }),
  },
  {
    name: "get_downright_installation",
    description: "Get Downright's macOS requirements, signed DMG link, and installation commands. Returns instructions without downloading or executing anything.",
    inputSchema: noInput,
    annotations: { readOnlyHint: true },
    execute: async () => result({
      operatingSystem: `macOS ${facts.minimumMacOS}+`,
      downloadUrl: facts.downloadUrl,
      artifact: facts.artifactName,
      channel: "Rolling main-channel release; the website's version is a published snapshot.",
      instructions: "Open the DMG, move Downright to Applications, and launch it once to finish system integration.",
      commands: { homebrew: brewCommand, shell: curlCommand, npm: npmCommand },
      guide: absolute("/download/"),
      releaseEvidence: absolute("/known-gaps/"),
    }),
  },
  {
    name: "find_downright_docs",
    description: "Find Downright guides, comparisons, release evidence, and reference pages by words in their title or description. An empty query lists all pages.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Topic to find, such as Quick Look, Codex, privacy, or installation. Empty lists all pages.", maxLength: 160 } },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => {
      const query = stringParameter(input, "query");
      if (query === undefined || query.length > 160) return error("Provide a query string of at most 160 characters; use an empty string to list every page.");
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = docs.filter((doc) => terms.every((term) => `${doc.title} ${doc.description} ${doc.path}`.toLowerCase().includes(term)));
      return result({ pages: matches.map((doc) => ({ ...doc, url: absolute(doc.path), markdownUrl: absolute(doc.markdownPath) })) });
    },
  },
  {
    name: "read_downright_doc",
    description: "Read the published Markdown content of a Downright page. Use a markdownPath returned by find_downright_docs; only published site documents can be read.",
    inputSchema: {
      type: "object",
      properties: { markdownPath: { type: "string", description: "Markdown path returned by find_downright_docs.", enum: docs.map((doc) => doc.markdownPath) } },
      required: ["markdownPath"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input, { signal }) => {
      const markdownPath = stringParameter(input, "markdownPath");
      const doc = docs.find((doc) => doc.markdownPath === markdownPath);
      if (!doc) return error("Unknown document. Use find_downright_docs to get an available markdownPath.");
      try {
        const response = await fetch(doc.markdownPath, { signal, redirect: "error" });
        if (!response.ok) return error(`The document could not be loaded (HTTP ${response.status}). Try its page at ${absolute(doc.path)}.`);
        return result({ title: doc.title, url: absolute(doc.path), markdownUrl: absolute(doc.markdownPath), markdown: await response.text() });
      } catch (cause) {
        if (signal.aborted) throw cause;
        return error(`The document could not be fetched. Try its page at ${absolute(doc.path)}.`);
      }
    },
  },
  {
    name: "get_downright_repository",
    description: "Find Downright's GitHub source repository, releases, issues, license, and optional ways to support the project. Does not change a GitHub account.",
    inputSchema: noInput,
    annotations: { readOnlyHint: true },
    execute: async () => result({
      repository: facts.repository,
      license: facts.license,
      issues: `${facts.repository}/issues`,
      releases: `${facts.repository}/releases`,
      support: { star: { url: facts.repository, instructions: "If you find Downright useful, you can choose Star on its GitHub repository while signed in to GitHub." }, sponsor: facts.sponsorsUrl },
    }),
  },
];

export async function registerSiteTools(context: ModelContext): Promise<void> {
  const registrations = await Promise.allSettled(tools.map(async (tool) => context.registerTool(tool)));
  document.documentElement.dataset.webmcp = registrations.every((registration) => registration.status === "fulfilled") ? "ready" : "unavailable";
}
