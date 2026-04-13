/**
 * Copy-on-Write Fork Visualization Engine  (OSC-172)
 *
 * Simulates the Copy-on-Write (COW) optimization for the fork() system
 * call, producing tick-by-tick events that show how pages are shared
 * after fork and lazily copied only when a write occurs.
 *
 * Traditional fork() duplicates the entire address space of the parent
 * — an expensive operation when the parent has hundreds of megabytes of
 * memory. COW avoids this waste:
 *
 *   1. fork() creates a new page table for the child, but all entries
 *      point to the SAME physical frames as the parent.
 *   2. Both page tables are marked READ-ONLY, and a reference count is
 *      incremented on each shared frame.
 *   3. When either process writes to a shared page, a page fault occurs.
 *      The fault handler:
 *        a. Allocates a new physical frame.
 *        b. Copies the contents of the old frame to the new frame.
 *        c. Updates the writing process's page table to point to the new frame.
 *        d. Decrements the reference count on the original frame.
 *   4. Pages that are never written are never copied — saving both time
 *      and memory.
 *
 * This is why fork() followed by a new program load is efficient: the
 * new program replaces the entire address space anyway, so none of the
 * shared pages ever need copying.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface COWEvent {
  tick: number;
  type:
    | 'fork'
    | 'share-page'
    | 'write-attempt'
    | 'page-fault'
    | 'copy-page'
    | 'update-mapping';
  processId: 'parent' | 'child';
  pageId: number;
  physicalFrame: number;
  refCount: number;
  description: string;
}

export interface COWResult {
  events: COWEvent[];
  totalPages: number;
  copiedPages: number;
  sharedPages: number;
  memorySaved: number;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface PageState {
  pageId: number;
  physicalFrame: number;
  refCount: number;
  parentFrame: number;
  childFrame: number;
  copied: boolean;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate a COW fork followed by selective child writes.
 *
 * The parent process owns `parentPages` pages mapped to physical frames
 * 0..parentPages-1. After fork, the child shares all frames. Then the
 * child writes to each page listed in `childWritePages`, triggering
 * COW page faults and copies.
 *
 * @param parentPages      - Number of pages in the parent's address space.
 * @param childWritePages  - Page indices (0-based) the child will write to.
 *                           Must be in range [0, parentPages).
 */
export function simulateCOWFork(
  parentPages: number,
  childWritePages: number[],
): COWResult {
  const events: COWEvent[] = [];
  let tick = 0;

  // Validate inputs
  const pages = Math.max(1, Math.min(parentPages, 256));
  const writeSet = childWritePages.filter((p) => p >= 0 && p < pages);

  // Track physical frame allocation — parent starts with frames 0..pages-1
  let nextFreeFrame = pages; // next unallocated physical frame

  // Initialize page states
  const pageStates: PageState[] = [];
  for (let i = 0; i < pages; i++) {
    pageStates.push({
      pageId: i,
      physicalFrame: i,
      refCount: 1,     // only parent references each frame initially
      parentFrame: i,
      childFrame: i,   // will be set to same as parent after fork
      copied: false,
    });
  }

  // -----------------------------------------------------------------------
  // Phase 1: Fork — share all pages between parent and child
  // -----------------------------------------------------------------------

  events.push({
    tick,
    type: 'fork',
    processId: 'parent',
    pageId: -1,
    physicalFrame: -1,
    refCount: 0,
    description:
      `Parent calls fork() — creating child process. ` +
      `Instead of copying all ${pages} pages (which would require ${pages} frame allocations ` +
      `and ${pages} memory copies), COW shares them with read-only permissions.`,
  });
  tick++;

  // Share each page: increment refcount, both processes point to same frame
  for (let i = 0; i < pages; i++) {
    const ps = pageStates[i];
    ps.refCount = 2;   // both parent and child now reference this frame
    ps.childFrame = ps.physicalFrame; // child's page table entry

    events.push({
      tick,
      type: 'share-page',
      processId: 'child',
      pageId: i,
      physicalFrame: ps.physicalFrame,
      refCount: ps.refCount,
      description:
        `Page ${i} shared — child's page table entry points to physical frame ${ps.physicalFrame} ` +
        `(same as parent). Both entries marked READ-ONLY. Refcount: ${ps.refCount}. ` +
        `No memory copied yet.`,
    });
  }

  // Summary event after sharing
  events.push({
    tick,
    type: 'fork',
    processId: 'child',
    pageId: -1,
    physicalFrame: -1,
    refCount: 0,
    description:
      `Fork created child sharing ${pages} pages — no memory copied yet (COW defers copying until needed). ` +
      `Memory saved so far: ${pages} frames (${(pages * 4)}KB assuming 4KB pages).`,
  });
  tick++;

  // -----------------------------------------------------------------------
  // Phase 2: Child writes — trigger COW page faults
  // -----------------------------------------------------------------------

  let copiedCount = 0;

  for (const writePageId of writeSet) {
    const ps = pageStates[writePageId];

    // Step 1: Write attempt
    events.push({
      tick,
      type: 'write-attempt',
      processId: 'child',
      pageId: writePageId,
      physicalFrame: ps.childFrame,
      refCount: ps.refCount,
      description:
        `Child attempts to write to page ${writePageId} (mapped to frame ${ps.childFrame}). ` +
        `The page is marked READ-ONLY because it is shared with the parent — ` +
        `this triggers a protection fault.`,
    });
    tick++;

    // Step 2: Page fault
    events.push({
      tick,
      type: 'page-fault',
      processId: 'child',
      pageId: writePageId,
      physicalFrame: ps.childFrame,
      refCount: ps.refCount,
      description:
        `PAGE FAULT on page ${writePageId} — the MMU detects a write to a read-only COW page. ` +
        `The OS page-fault handler recognizes this as a COW fault (refcount=${ps.refCount} > 1) ` +
        `and initiates the copy-on-write sequence.`,
    });
    tick++;

    // Step 3: Copy page to new frame
    const oldFrame = ps.childFrame;
    const newFrame = nextFreeFrame;
    nextFreeFrame++;

    const oldRefCount = ps.refCount;
    ps.refCount--;
    ps.childFrame = newFrame;
    ps.copied = true;
    copiedCount++;

    events.push({
      tick,
      type: 'copy-page',
      processId: 'child',
      pageId: writePageId,
      physicalFrame: newFrame,
      refCount: ps.refCount,
      description:
        `Child writes to page ${writePageId} — triggers page fault, ` +
        `page copied to new frame ${newFrame} (refcount ${oldRefCount}->${ps.refCount}). ` +
        `The 4KB contents of frame ${oldFrame} are memcpy'd to frame ${newFrame}.`,
    });
    tick++;

    // Step 4: Update mapping
    events.push({
      tick,
      type: 'update-mapping',
      processId: 'child',
      pageId: writePageId,
      physicalFrame: newFrame,
      refCount: ps.refCount,
      description:
        `Child's page table updated: page ${writePageId} now maps to frame ${newFrame} (read-write). ` +
        `Parent still maps page ${writePageId} to frame ${oldFrame}` +
        (ps.refCount === 1
          ? ` (now also read-write since refcount=1 — no other process shares it).`
          : ` (still read-only since refcount=${ps.refCount}).`) +
        ` The child can now write freely to this page without affecting the parent.`,
    });
    tick++;
  }

  // -----------------------------------------------------------------------
  // Compute summary
  // -----------------------------------------------------------------------

  const sharedPages = pages - copiedCount;
  const memorySaved = sharedPages; // frames not duplicated

  // Final summary event
  if (writeSet.length > 0) {
    events.push({
      tick,
      type: 'fork',
      processId: 'child',
      pageId: -1,
      physicalFrame: -1,
      refCount: 0,
      description:
        `COW fork complete. Of ${pages} total pages, only ${copiedCount} were actually copied ` +
        `(${((copiedCount / pages) * 100).toFixed(1)}%). ` +
        `${sharedPages} pages remain shared — saving ${sharedPages} frames ` +
        `(${sharedPages * 4}KB). ` +
        (copiedCount === 0
          ? `No writes occurred — the child never modified any shared pages, ` +
            `so the zero-copy fork was essentially free.`
          : `Without COW, fork() would have copied all ${pages} pages eagerly, ` +
            `wasting ${sharedPages} frame allocations and memory copies.`),
    });
  }

  return {
    events,
    totalPages: pages,
    copiedPages: copiedCount,
    sharedPages,
    memorySaved,
  };
}
