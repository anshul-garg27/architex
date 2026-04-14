# Agent 8: Frontend Bug Auditor

> **Mission**: Audit all LLD module React components for runtime bugs, null pointer risks, stale state, and missing error boundaries.
> **Scope**: `src/components/modules/lld/**/*.tsx` — ~30 component files
> **Status**: ✅ All P0 findings fixed

---

## Methodology

1. Read all LLD panel, canvas, and sidebar components
2. Checked for:
   - Null/undefined access without guards
   - Stale state (state not reset on prop changes)
   - Missing loading/error states
   - Accessibility issues (missing aria labels, keyboard nav)
   - Component crashes on empty data

---

## Findings

### CRITICAL: ReviewWidget showAnswer Not Reset on Item Change

**File**: `src/components/modules/lld/panels/ReviewWidget.tsx`
**Severity**: P0

When advancing to the next review item, the `showAnswer` state was not reset to `false`. This caused the answer to be visible immediately for the next question — defeating the purpose of flashcard review.

```typescript
// BUG: showAnswer stays true when currentConceptId changes
const [showAnswer, setShowAnswer] = useState(false);
// Missing: useEffect to reset on currentConceptId change
```

**Fix**: Added `useEffect` that resets `showAnswer` to `false` when `currentConceptId` changes.

### CRITICAL: PatternQuiz Question Can Be Undefined Mid-Quiz

**File**: `src/components/modules/lld/panels/PatternQuizFiltered.tsx`
**Severity**: P0

When difficulty changes mid-quiz (adaptive difficulty feature), the question array is rebuilt. If `currentIndex` exceeds the new array length, `questions[currentIndex]` returns `undefined`, causing a crash.

```typescript
// BUG: currentQuestion can be undefined after difficulty change
const currentQuestion = questions[currentIndex];
// Then: currentQuestion.text → TypeError: Cannot read property 'text' of undefined
```

**Fix**: Added null guard — if `currentQuestion` is undefined, show "Loading..." or skip to next valid question.

### HIGH: WalkthroughPlayer Returns Null Silently

**File**: `src/components/modules/lld/panels/WalkthroughPlayer.tsx`
**Severity**: P1

When no walkthrough exists for the selected pattern, the component returned `null` — rendering an empty tab. Users would see a blank panel with no explanation.

```typescript
// Before: silent null return
if (!walkthrough) return null;

// After: informative message
if (!walkthrough) return (
  <div className="text-muted-foreground p-4 text-center">
    No walkthrough available for this pattern yet.
  </div>
);
```

### HIGH: ReviewWidget Breaks Without Clerk Auth

**File**: `src/components/modules/lld/panels/ReviewWidget.tsx`
**Severity**: P1

The ReviewWidget called `useUser()` from Clerk unconditionally. In dev mode without Clerk configured, this throws. The AI Review panel had the same issue.

**Note**: This was already partially fixed by the conditional ClerkProvider work, but the component itself should also handle the case gracefully.

### MEDIUM: AIReviewPanel No Guard for Empty Canvas

**File**: `src/components/modules/lld/canvas/AIReviewPanel.tsx`
**Severity**: P2

If the user opens the AI Review panel when no pattern is selected (empty canvas), the API call sends an empty classes array. The API returns a generic "no pattern detected" response, but the UX could be better — disable the button when canvas is empty.

---

## Fix Applied

**Commit**: `01d90a7` — "fix(lld): fix content audit issues in patterns and components"

Files modified:
- `PatternQuizFiltered.tsx` — Added null guard for undefined question
- `ReviewWidget.tsx` — Added `useEffect` to reset `showAnswer` on item change
- `WalkthroughPlayer.tsx` — Changed null return to informative empty state message

**Result**: All 3 P0 UI bugs fixed. P1/P2 items documented for future work.
