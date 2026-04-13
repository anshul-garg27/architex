# Algorithm Content Style Guide — World-Class (Grade A) Standard

> The goal: a student who reads our content should understand the algorithm
> BETTER than from any textbook, YouTube video, or competing tool. Not "as good."
> BETTER.

## The Standard We're Targeting

Study these references. They are the benchmark:
- **Red Blob Games** (https://redblobgames.com/pathfinding/a-star/) — interactive, progressive, comparison-based
- **3Blue1Brown** — visual intuition before formalism, "aha moment" design
- **Brilliant.org** — problem-first, interactive, adaptive
- **Stack Overflow Blog: Beginners Guide to DP** — analogy-first, builds from known to unknown

## Description Template (EVERY algorithm)

```
HOOK (1 sentence — make them NEED to know this):
  Question, real-world scenario, or motivation. NEVER a definition.
  BAD: "Bubble Sort is a comparison-based sorting algorithm."
  GOOD: "What if you could only compare two cards next to each other — how would you sort a whole deck?"

INTUITION (2-3 sentences — build the mental model):
  Concrete analogy that a 15-year-old would understand.
  MUST create a visual image in the reader's mind.
  BAD: "Compares adjacent elements and swaps."
  GOOD: "Like bubbles in a soda glass — the biggest bubble rises to the top first.
         Each pass through the array pushes the next-largest value to the end."

MECHANISM (1-2 sentences — what it actually does):
  The current description, refined for clarity.

WHEN TO USE (1 sentence — vs alternatives):
  "Use this when... Prefer [alternative] when..."

REAL-WORLD (1 sentence — where it's used in production):
  Specific company/product/system. Not "used in many applications."

KEY INSIGHT (1 sentence — the thing to remember):
  The one sentence that would go on a flashcard.
```

Total: ~100-150 words. Fits in a sidebar panel.

## Step Description Rules

### First occurrence of each operation type: FULL WHY

```
CURRENT: "Compare arr[2]=5 with arr[3]=3"
WORLD-CLASS: "Compare neighbors 5 and 3. In Bubble Sort, we always check
             adjacent pairs — if the left is bigger, they're out of order.
             Since 5 > 3, we need to swap."
```

### Subsequent occurrences: SHORTER

```
"Compare 8 and 2 — 8 > 2, so swap."
```

### Milestone steps: CONNECT TO BIG PICTURE

```
CURRENT: "Element at index 9 is now in its sorted position"
WORLD-CLASS: "Pass 1 complete! The largest value (9) has 'bubbled' to the end.
             It will never move again. Now we repeat for the remaining 9 elements."
```

### Edge case steps: TEACH THE EXCEPTION

```
"No swaps this pass! That means every adjacent pair is already in order —
 the array is sorted. This early-exit optimization is why Bubble Sort has
 O(n) best case on nearly-sorted input."
```

## Complexity Intuition

NEVER just show "O(n²)". Always include:

```
NOTATION: O(n²)
INTUITION: "Each element might compare with every other element.
           Double the array → 4x the work.
           10 elements ≈ 45 comparisons, 100 elements ≈ 4,950."
FEEL IT: "Run on 10, then 20, then 50 elements. Watch the counter."
```

## Common Mistakes

At least 2 per top-20 algorithm. Format:

```
MISTAKE: "Students think Quick Sort is always faster than Merge Sort."
TRUTH: "On sorted input with last-element pivot (Lomuto), Quick Sort
        degrades to O(n²). Try it: run Quick Sort on 'Reverse Sorted' preset."
```

## Summary (3-Bullet Flashcard)

```
1. CORE IDEA: Compare adjacent pairs, swap if wrong order, repeat.
2. KEY PROPERTY: Stable, in-place, O(n) best case with early exit.
3. REMEMBER: "Biggest bubble rises first" — each pass places one more element.
```
