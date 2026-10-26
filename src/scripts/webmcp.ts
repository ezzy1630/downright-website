import type { ModelContext } from "../agents/webmcp";

// Progressive enhancement: unsupported browsers never load the tool catalog.
// navigator.modelContext covers browsers predating the move to Document.
const context: ModelContext | undefined = document.modelContext ?? navigator.modelContext;
if (context && typeof context.registerTool === "function") {
  void import("../agents/webmcp")
    .then(({ registerSiteTools }) => registerSiteTools(context))
    .catch(() => { document.documentElement.dataset.webmcp = "unavailable"; });
}
