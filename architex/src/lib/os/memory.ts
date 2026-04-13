/**
 * Memory Management Simulations
 *
 * Provides virtual-to-physical address translation with a page table and
 * TLB, plus a full virtual memory access simulator that models page faults
 * and TLB misses over a sequence of virtual addresses.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageTableEntry {
  virtualPage: number;
  physicalFrame: number | null;
  valid: boolean;
  dirty: boolean;
  referenced: boolean;
}

export interface AddressTranslation {
  virtualAddress: number;
  virtualPage: number;
  offset: number;
  physicalFrame: number | null;
  physicalAddress: number | null;
  pageFault: boolean;
  tlbHit: boolean;
  description: string;
}

// ---------------------------------------------------------------------------
// Address Translation
// ---------------------------------------------------------------------------

/**
 * Translate a single virtual address using the provided page table and TLB.
 *
 * Steps:
 * 1. Split the virtual address into page number and offset using the page
 *    size (which must be a power of 2).
 * 2. Look up the page number in the TLB. If found this is a TLB hit.
 * 3. On TLB miss, consult the page table. If the entry is valid, the
 *    mapping is resolved; otherwise it is a page fault.
 *
 * @param virtualAddress - The address to translate.
 * @param pageSize       - Size of a page (must be a power of 2).
 * @param pageTable      - Indexed by virtual page number.
 * @param tlb            - Maps virtual page number -> physical frame number.
 */
export function translateAddress(
  virtualAddress: number,
  pageSize: number,
  pageTable: PageTableEntry[],
  tlb: Map<number, number>,
): AddressTranslation {
  const offsetBits = Math.log2(pageSize);
  if (!Number.isInteger(offsetBits)) {
    throw new Error('pageSize must be a power of 2');
  }

  const virtualPage = Math.floor(virtualAddress / pageSize);
  const offset = virtualAddress % pageSize;

  // 1. TLB lookup
  const tlbFrame = tlb.get(virtualPage);
  if (tlbFrame !== undefined) {
    const physicalAddress = tlbFrame * pageSize + offset;
    return {
      virtualAddress,
      virtualPage,
      offset,
      physicalFrame: tlbFrame,
      physicalAddress,
      pageFault: false,
      tlbHit: true,
      description:
        `TLB HIT: VA ${virtualAddress} -> page ${virtualPage}, offset ${offset} ` +
        `-> frame ${tlbFrame} -> PA ${physicalAddress} — TLB cached this mapping, skipping the slow page table lookup`,
    };
  }

  // 2. Page table lookup
  const entry = pageTable[virtualPage] as PageTableEntry | undefined;

  if (!entry || !entry.valid || entry.physicalFrame === null) {
    return {
      virtualAddress,
      virtualPage,
      offset,
      physicalFrame: null,
      physicalAddress: null,
      pageFault: true,
      tlbHit: false,
      description:
        `PAGE FAULT: VA ${virtualAddress} -> page ${virtualPage} is not in memory — page was not in memory, loaded from disk (costly ~1ms operation)`,
    };
  }

  const physicalAddress = entry.physicalFrame * pageSize + offset;
  return {
    virtualAddress,
    virtualPage,
    offset,
    physicalFrame: entry.physicalFrame,
    physicalAddress,
    pageFault: false,
    tlbHit: false,
    description:
      `TLB MISS, Page Table HIT: VA ${virtualAddress} -> page ${virtualPage}, offset ${offset} ` +
      `-> frame ${entry.physicalFrame} -> PA ${physicalAddress} — TLB missed, but the page is in physical memory via page table`,
  };
}

// ---------------------------------------------------------------------------
// Virtual Memory Simulator
// ---------------------------------------------------------------------------

/**
 * Simulate a sequence of virtual memory accesses with a page table, TLB,
 * and limited physical frames.
 *
 * The simulator uses LRU replacement for both the TLB and physical frames.
 * On a page fault, the least recently used physical frame is evicted and the
 * new page is loaded. The TLB is similarly maintained with LRU eviction.
 *
 * @param accessPattern  - Sequence of virtual addresses to access.
 * @param pageSize       - Bytes per page (power of 2).
 * @param physicalFrames - Total number of physical frames available.
 * @param tlbSize        - Maximum number of entries in the TLB.
 * @returns An ordered array of {@link AddressTranslation} events.
 */
export function simulateVirtualMemory(
  accessPattern: number[],
  pageSize: number,
  physicalFrames: number,
  tlbSize: number,
): AddressTranslation[] {
  const offsetBits = Math.log2(pageSize);
  if (!Number.isInteger(offsetBits)) {
    throw new Error('pageSize must be a power of 2');
  }

  const results: AddressTranslation[] = [];

  // Page table -- sized to cover the maximum virtual page referenced
  const maxPage = Math.max(
    ...accessPattern.map((a) => Math.floor(a / pageSize)),
  );
  const pageTable: PageTableEntry[] = [];
  for (let i = 0; i <= maxPage; i++) {
    pageTable.push({
      virtualPage: i,
      physicalFrame: null,
      valid: false,
      dirty: false,
      referenced: false,
    });
  }

  // TLB as a Map (virtual page -> physical frame)
  const tlb = new Map<number, number>();
  // TLB access order for LRU (most recent at end)
  const tlbOrder: number[] = [];

  // Physical frame allocation: frame index -> virtual page (-1 = free)
  const frameOwner: number[] = Array(physicalFrames).fill(-1);
  // Frame access order for LRU (most recent at end)
  const frameOrder: number[] = [];

  /** Update LRU order list by moving `item` to the end. */
  function touchLRU(list: number[], item: number): void {
    const idx = list.indexOf(item);
    if (idx !== -1) list.splice(idx, 1);
    list.push(item);
  }

  for (const va of accessPattern) {
    const vp = Math.floor(va / pageSize);
    const off = va % pageSize;

    // --- TLB check ---
    const tlbFrame = tlb.get(vp);
    if (tlbFrame !== undefined) {
      // TLB hit
      touchLRU(tlbOrder, vp);
      const frame = tlbFrame;
      touchLRU(frameOrder, frame);
      pageTable[vp].referenced = true;

      results.push({
        virtualAddress: va,
        virtualPage: vp,
        offset: off,
        physicalFrame: frame,
        physicalAddress: frame * pageSize + off,
        pageFault: false,
        tlbHit: true,
        description:
          `TLB HIT: VA ${va} -> page ${vp}, offset ${off} -> frame ${frame} -> PA ${frame * pageSize + off} — TLB cached this mapping, skipping the slow page table lookup`,
      });
      continue;
    }

    // --- TLB miss: check page table ---
    const pte = pageTable[vp];
    if (pte.valid && pte.physicalFrame !== null) {
      // Page table hit -- load into TLB
      const frame = pte.physicalFrame;
      insertTLB(tlb, tlbOrder, tlbSize, vp, frame);
      touchLRU(frameOrder, frame);
      pte.referenced = true;

      results.push({
        virtualAddress: va,
        virtualPage: vp,
        offset: off,
        physicalFrame: frame,
        physicalAddress: frame * pageSize + off,
        pageFault: false,
        tlbHit: false,
        description:
          `TLB MISS, Page Table HIT: VA ${va} -> page ${vp}, offset ${off} -> frame ${frame} -> PA ${frame * pageSize + off} — TLB missed, but the page is in physical memory via page table`,
      });
      continue;
    }

    // --- Page fault ---
    let frame: number;
    const freeFrame = frameOwner.indexOf(-1);
    if (freeFrame !== -1) {
      frame = freeFrame;
    } else {
      // LRU frame eviction
      frame = frameOrder.shift()!;
      // Invalidate old mapping
      const oldPage = frameOwner[frame];
      if (oldPage !== -1 && pageTable[oldPage]) {
        pageTable[oldPage].valid = false;
        pageTable[oldPage].physicalFrame = null;
        // Remove from TLB if present
        tlb.delete(oldPage);
        const tlbIdx = tlbOrder.indexOf(oldPage);
        if (tlbIdx !== -1) tlbOrder.splice(tlbIdx, 1);
      }
    }

    // Map new page
    frameOwner[frame] = vp;
    pte.physicalFrame = frame;
    pte.valid = true;
    pte.referenced = true;
    touchLRU(frameOrder, frame);
    insertTLB(tlb, tlbOrder, tlbSize, vp, frame);

    results.push({
      virtualAddress: va,
      virtualPage: vp,
      offset: off,
      physicalFrame: frame,
      physicalAddress: frame * pageSize + off,
      pageFault: true,
      tlbHit: false,
      description:
        `PAGE FAULT: VA ${va} -> page ${vp} loaded into frame ${frame} -> PA ${frame * pageSize + off} — page was not in memory, loaded from disk (costly ~1ms operation)`,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Insert a mapping into the TLB, evicting the LRU entry if the TLB is full.
 */
function insertTLB(
  tlb: Map<number, number>,
  tlbOrder: number[],
  maxSize: number,
  virtualPage: number,
  frame: number,
): void {
  if (tlb.has(virtualPage)) {
    // Update existing entry
    tlb.set(virtualPage, frame);
    const idx = tlbOrder.indexOf(virtualPage);
    if (idx !== -1) tlbOrder.splice(idx, 1);
    tlbOrder.push(virtualPage);
    return;
  }

  if (tlb.size >= maxSize) {
    // Evict LRU
    const victim = tlbOrder.shift();
    if (victim !== undefined) {
      tlb.delete(victim);
    }
  }
  tlb.set(virtualPage, frame);
  tlbOrder.push(virtualPage);
}
