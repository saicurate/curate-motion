// The library page's Prompts and Inspo tabs: the JSON API behind /api/prompts/* and /api/inspo/*.
// tools/library-ui.ts routes here after its localhost / Host / token checks; this file only maps
// requests onto the same code as tools/prompts and tools/inspo (tools/lib/prompts.ts, inspo.ts).
import { INSPO_KINDS } from "../../schemas/inspo.ts";
import { OUTCOMES, PROMPT_AREAS } from "../../schemas/prompt.ts";
import { buildInspoIndex, buildPromptIndex, loadInspo, loadPrompts } from "./boards.ts";
import { addInspo, archiveInspo, breakdownInspo, editInspo } from "./inspo.ts";
import { addPrompt, ratePrompt, remixDraft, usePrompt } from "./prompts.ts";

type J = Record<string, unknown>;
const words = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(/[,\n]/) : []).map((s) => s.trim()).filter(Boolean);
const lines = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split("\n") : []).map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

/** GET: the current prompts / inspo, read straight from the files (always fresh). */
export const boardsGet = (path: string): unknown => {
  if (path === "/api/prompts") {
    const { ok, errors } = loadPrompts();
    return { ...buildPromptIndex(ok), errors, areas: PROMPT_AREAS, outcomes: OUTCOMES };
  }
  if (path === "/api/inspo") {
    const { ok, errors } = loadInspo();
    return { ...buildInspoIndex(ok), errors, kinds: INSPO_KINDS };
  }
  return undefined;
};

/** POST (JSON). `by` is who is at the page (the founder, unless ?by= says otherwise). */
export const boardsPost = (path: string, j: J, by: string, push: boolean): unknown => {
  switch (path) {
    case "/api/prompts/add": {
      const p = addPrompt({
        body: String(j.body ?? ""),
        title: String(j.title ?? ""),
        area: String(j.area ?? ""),
        name: j.name ? String(j.name) : undefined,
        author: String(j.author || (by === "founder" ? "founder" : `agent:${by}`)),
        target: String(j.target ?? ""),
        outcome: j.outcome ? String(j.outcome) : undefined,
        rating: j.rating ?? undefined,
        why: j.why ? String(j.why) : undefined,
        tags: words(j.tags),
        parents: words(j.parents),
        inputs: words(j.inputs),
        outputs: words(j.outputs),
        addedBy: `${by} (library page)`,
      });
      return { id: p.meta.id, path: p.path };
    }
    case "/api/prompts/rate":
      return ratePrompt(String(j.id), j.rating ?? undefined, { outcome: j.outcome ? String(j.outcome) : undefined, why: typeof j.why === "string" ? j.why : undefined });
    case "/api/prompts/use":
      return usePrompt(String(j.id));
    case "/api/prompts/remix-draft":
      return remixDraft(words(j.ids), { title: j.title ? String(j.title) : undefined });
    case "/api/inspo/add-link": {
      const x = addInspo({ url: String(j.url ?? ""), title: String(j.title ?? ""), kind: j.kind ? String(j.kind) : undefined, love: lines(j.love), tags: words(j.tags), useFor: words(j.useFor), source: j.source ? String(j.source) : undefined, sourceNote: j.from ? String(j.from) : undefined, by, push });
      return { id: x.meta.id, path: x.path };
    }
    case "/api/inspo/archive":
      return archiveInspo(String(j.id), { unarchive: !!j.undo });
    case "/api/inspo/breakdown":
      return breakdownInspo(String(j.id), { by, push });
    case "/api/inspo/edit": {
      const w = editInspo(String(j.id), { love: j.love !== undefined ? lines(j.love) : undefined, tags: j.tags !== undefined ? words(j.tags) : undefined, useFor: j.useFor !== undefined ? words(j.useFor) : undefined });
      return { id: w.meta.id };
    }
    default:
      return undefined;
  }
};

/** POST /api/inspo/add-file?title=…&love=…&tags=…: the dropped file, already saved to a temp path by the server. */
export const inspoUpload = (file: string, q: Record<string, string>, by: string, push: boolean) => {
  const x = addInspo({ file, url: q.url || undefined, title: q.title || "", kind: q.kind || undefined, love: lines(q.love), tags: words(q.tags), useFor: words(q.useFor), source: q.source || undefined, sourceNote: q.from || undefined, by, push });
  return { id: x.meta.id, path: x.path, asset: x.meta.asset };
};
