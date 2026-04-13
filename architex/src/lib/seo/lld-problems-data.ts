// ── LLD Problem SEO data — thin re-export from canonical source ──
//
// All LLD problem data now lives in @/lib/lld/problems.ts.
// This file re-exports the types and helpers that SEO pages need,
// maintaining backward compatibility for existing imports.

export {
  type LLDDifficulty,
  type LLDCategory,
  type InterviewFrequency,
  type LLDProblem as LLDProblemDefinition,
  LLD_PROBLEMS,
  getLLDProblemBySlug,
  getAllLLDProblemSlugs,
  getRelatedLLDProblems,
} from "@/lib/lld/problems";
