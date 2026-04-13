import { describe, it, expect, beforeEach } from "vitest";
import {
  EventStore,
  createDiagramEvent,
  type DiagramEvent,
  type NodeAddedData,
  type NodeRemovedData,
  type NodeMovedData,
  type EdgeAddedData,
  type TemplateLoadedData,
  type SimulationRunData,
} from "@/lib/version-history/event-types";

// ── Helpers ──────────────────────────────────────────────────

function makeNodeAddedEvent(
  nodeId: string,
  userId?: string,
): DiagramEvent<"NodeAdded"> {
  return createDiagramEvent(
    "NodeAdded",
    {
      node: {
        id: nodeId,
        type: "system-design",
        position: { x: 100, y: 200 },
        data: { label: nodeId, category: "compute" },
      },
    },
    userId,
  );
}

function makeNodeRemovedEvent(nodeId: string): DiagramEvent<"NodeRemoved"> {
  return createDiagramEvent("NodeRemoved", {
    nodeId,
    node: {
      id: nodeId,
      type: "system-design",
      position: { x: 0, y: 0 },
      data: { label: nodeId },
    },
  });
}

function makeEdgeAddedEvent(edgeId: string): DiagramEvent<"EdgeAdded"> {
  return createDiagramEvent("EdgeAdded", {
    edge: {
      id: edgeId,
      source: "n1",
      target: "n2",
    },
  });
}

// ── Tests ────────────────────────────────────────────────────

describe("EventStore", () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore();
  });

  // ── Basic Operations ──────────────────────────────────────

  it("starts empty", () => {
    expect(store.getEventCount()).toBe(0);
    expect(store.getEvents()).toEqual([]);
    expect(store.getLatest()).toBeUndefined();
  });

  it("appends events and reports count", () => {
    store.append(makeNodeAddedEvent("n1"));
    store.append(makeNodeAddedEvent("n2"));

    expect(store.getEventCount()).toBe(2);
  });

  it("returns all events in insertion order", () => {
    const e1 = makeNodeAddedEvent("n1");
    const e2 = makeEdgeAddedEvent("e1");
    const e3 = makeNodeRemovedEvent("n1");

    store.append(e1);
    store.append(e2);
    store.append(e3);

    const events = store.getEvents();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("NodeAdded");
    expect(events[1].type).toBe("EdgeAdded");
    expect(events[2].type).toBe("NodeRemoved");
  });

  it("getLatest returns the most recent event", () => {
    store.append(makeNodeAddedEvent("n1"));
    store.append(makeEdgeAddedEvent("e1"));

    const latest = store.getLatest();
    expect(latest).toBeDefined();
    expect(latest!.type).toBe("EdgeAdded");
  });

  // ── Filtering by Timestamp ────────────────────────────────

  it("filters events by timestamp with getEvents(since)", () => {
    const e1 = makeNodeAddedEvent("n1");
    // Manually set timestamps to control ordering
    (e1 as { timestamp: number }).timestamp = 1000;

    const e2 = makeNodeAddedEvent("n2");
    (e2 as { timestamp: number }).timestamp = 2000;

    const e3 = makeEdgeAddedEvent("e1");
    (e3 as { timestamp: number }).timestamp = 3000;

    store.append(e1);
    store.append(e2);
    store.append(e3);

    const afterFirst = store.getEvents(1000);
    expect(afterFirst).toHaveLength(2);
    expect(afterFirst[0].type).toBe("NodeAdded");
    expect((afterFirst[0].data as NodeAddedData).node.id).toBe("n2");

    const afterSecond = store.getEvents(2000);
    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].type).toBe("EdgeAdded");

    const afterAll = store.getEvents(3000);
    expect(afterAll).toHaveLength(0);
  });

  it("returns all events when since is undefined", () => {
    store.append(makeNodeAddedEvent("n1"));
    store.append(makeNodeAddedEvent("n2"));

    expect(store.getEvents(undefined)).toHaveLength(2);
    expect(store.getEvents()).toHaveLength(2);
  });

  // ── Clear ─────────────────────────────────────────────────

  it("clears all events", () => {
    store.append(makeNodeAddedEvent("n1"));
    store.append(makeNodeAddedEvent("n2"));

    store.clear();

    expect(store.getEventCount()).toBe(0);
    expect(store.getEvents()).toEqual([]);
    expect(store.getLatest()).toBeUndefined();
  });

  // ── Event Data Integrity ──────────────────────────────────

  it("preserves NodeAdded event data", () => {
    const event = makeNodeAddedEvent("server-1", "user-42");
    store.append(event);

    const retrieved = store.getEvents()[0] as DiagramEvent<"NodeAdded">;
    expect(retrieved.type).toBe("NodeAdded");
    expect(retrieved.data.node.id).toBe("server-1");
    expect(retrieved.data.node.position).toEqual({ x: 100, y: 200 });
    expect(retrieved.userId).toBe("user-42");
  });

  it("preserves NodeRemoved event data", () => {
    const event = makeNodeRemovedEvent("cache-1");
    store.append(event);

    const retrieved = store.getEvents()[0] as DiagramEvent<"NodeRemoved">;
    expect(retrieved.type).toBe("NodeRemoved");
    expect((retrieved.data as NodeRemovedData).nodeId).toBe("cache-1");
    expect((retrieved.data as NodeRemovedData).node.id).toBe("cache-1");
  });

  it("preserves NodeMoved event data", () => {
    const event = createDiagramEvent("NodeMoved", {
      nodeId: "n1",
      from: { x: 0, y: 0 },
      to: { x: 100, y: 200 },
    });
    store.append(event);

    const retrieved = store.getEvents()[0];
    expect(retrieved.type).toBe("NodeMoved");
    expect((retrieved.data as NodeMovedData).from).toEqual({ x: 0, y: 0 });
    expect((retrieved.data as NodeMovedData).to).toEqual({ x: 100, y: 200 });
  });

  it("preserves TemplateLoaded event data", () => {
    const event = createDiagramEvent("TemplateLoaded", {
      templateId: "t-1",
      templateName: "URL Shortener",
      nodeCount: 5,
      edgeCount: 4,
    });
    store.append(event);

    const retrieved = store.getEvents()[0];
    const data = retrieved.data as TemplateLoadedData;
    expect(data.templateName).toBe("URL Shortener");
    expect(data.nodeCount).toBe(5);
  });

  it("preserves SimulationRun event data", () => {
    const event = createDiagramEvent("SimulationRun", {
      durationMs: 5000,
      ticks: 100,
      finalThroughput: 12500,
      finalLatency: 45,
    });
    store.append(event);

    const retrieved = store.getEvents()[0];
    const data = retrieved.data as SimulationRunData;
    expect(data.durationMs).toBe(5000);
    expect(data.finalThroughput).toBe(12500);
  });

  // ── createDiagramEvent helper ─────────────────────────────

  it("createDiagramEvent sets a timestamp", () => {
    const before = Date.now();
    const event = createDiagramEvent("EdgeRemoved", {
      edgeId: "e1",
      edge: { id: "e1", source: "n1", target: "n2" },
    });
    const after = Date.now();

    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
  });

  it("createDiagramEvent userId is optional", () => {
    const withUser = createDiagramEvent(
      "NodeAdded",
      {
        node: { id: "n1", position: { x: 0, y: 0 }, data: {} },
      },
      "user-1",
    );
    const withoutUser = createDiagramEvent("NodeAdded", {
      node: { id: "n2", position: { x: 0, y: 0 }, data: {} },
    });

    expect(withUser.userId).toBe("user-1");
    expect(withoutUser.userId).toBeUndefined();
  });

  // ── Returns copies (not references) ───────────────────────

  it("getEvents returns a copy of the internal array", () => {
    store.append(makeNodeAddedEvent("n1"));

    const events1 = store.getEvents();
    const events2 = store.getEvents();

    expect(events1).toEqual(events2);
    expect(events1).not.toBe(events2); // different array references
  });
});
