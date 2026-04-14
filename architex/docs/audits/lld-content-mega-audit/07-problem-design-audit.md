# Agent 7: Problem Design Auditor

> **Mission**: Audit all 33 problems for requirements quality, pattern assignment balance, difficulty distribution, and cross-references.
> **Scope**: `module_content WHERE content_type='problem'` — 33 rows
> **Status**: P1 findings documented, P0 cross-ref fix applied

---

## Methodology

1. For each of 33 problems, evaluated:
   - Number of requirements (target: 5-8)
   - Quality of requirements (specific vs vague)
   - Pattern assignment (`keyPatterns[]`) correctness and balance
   - Difficulty level distribution across all problems
   - Cross-references to related problems (`relatedProblems[]`)
   - Slug consistency (slug matches expected naming convention)
2. Aggregated pattern assignment frequency to find over/under-representation

---

## Findings

### HIGH: 4 Problem Slug Mismatches

| Expected Slug | Actual Slug | Issue |
|---------------|-------------|-------|
| `chess` | `chess-game` | Inconsistent with URL pattern |
| `elevator` | `elevator-system` | Inconsistent with URL pattern |
| `file-system` | `filesystem` | Missing hyphen |
| `social-media` | `social-media-feed` | Overly specific slug |

**Impact**: If any component references problems by the expected slug, it won't find the row. Currently no breakage detected, but it's a maintenance risk.

### HIGH: 6 Problems Have < 5 Requirements

| Problem | Requirements Count | Minimum Expected |
|---------|-------------------|-----------------|
| tic-tac-toe | 3 | 5 |
| url-shortener | 4 | 5 |
| logger | 3 | 5 |
| stack-overflow | 4 | 5 |
| chat-system | 4 | 5 |
| file-system | 3 | 5 |

**Impact**: Thin requirements lead to trivial solutions. A good LLD interview problem should have 5-8 requirements to force non-trivial design decisions.

### HIGH: Strategy + Observer Over-Assigned in Problems

Pattern assignment frequency across 33 problems:

| Pattern | # Problems Assigned | % of Problems |
|---------|-------------------|---------------|
| strategy | 31 | 94% |
| observer | 28 | 85% |
| factory-method | 22 | 67% |
| singleton | 20 | 61% |
| command | 15 | 45% |
| builder | 12 | 36% |
| ... | ... | ... |
| interpreter | 1 | 3% |
| visitor | 1 | 3% |
| flyweight | 2 | 6% |

**Issue**: Strategy and Observer are assigned to almost every problem, which dilutes their value as pattern indicators. If Observer is relevant to 85% of problems, it doesn't help learners understand WHEN to use Observer vs another pattern.

**Recommendation**: Be more selective — a pattern should be assigned to a problem only if it's a CORE architectural choice, not just "you could use it".

### MEDIUM: No Difficulty 1 or 5 Problems

| Difficulty | Count |
|------------|-------|
| 1 (Beginner) | 0 |
| 2 (Easy) | 8 |
| 3 (Medium) | 17 |
| 4 (Hard) | 8 |
| 5 (Expert) | 0 |

**Recommendation**: Add 2-3 beginner problems (tic-tac-toe, calculator) and 2-3 expert problems (distributed cache, real-time collaboration).

### MEDIUM: Zero Problem Guides Exist

No `content_type='problem-guide'` rows exist in the database. Problem guides should include:
- Progressive hints (gated by time)
- Reference solutions with multiple approaches
- Evaluation rubrics
- Time breakdown (requirements gathering, class design, relationship mapping, review)

This is a major gap for the Problem mode tabs.

---

## Fix Applied (Partial)

**Cross-reference fixes only** — applied via `src/db/seeds/fix-code-bugs.ts`:
- `atm` problem: changed `relatedProblems` from "stock-exchange" → "stock-brokerage"
- `airline-booking` problem: changed `relatedProblems` from "stock-exchange" → "stock-brokerage"

**Remaining (not yet fixed)**:
- Slug mismatches (need migration plan)
- Thin requirements (need content generation)
- Pattern over-assignment (need editorial review)
- Problem guides (need new content type + 33 guides)
