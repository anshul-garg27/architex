import { describe, expect, it } from "vitest";
import { INCIDENTS, INCIDENT_SLUGS, getIncidentBySlug } from "../index";
import { FACEBOOK_BGP_2021 } from "../facebook-bgp-2021";

describe("incident registry", () => {
  it("registers every incident under its own slug", () => {
    for (const [slug, incident] of Object.entries(INCIDENTS)) {
      expect(incident.meta.slug).toBe(slug);
    }
    expect(INCIDENT_SLUGS).toContain("facebook-bgp-2021");
  });

  it("getIncidentBySlug returns the incident or null", () => {
    expect(getIncidentBySlug("facebook-bgp-2021")).toBe(FACEBOOK_BGP_2021);
    expect(getIncidentBySlug("not-a-real-incident")).toBeNull();
  });
});

describe.each(Object.values(INCIDENTS).map((i) => [i.meta.slug, i] as const))(
  "incident %s",
  (_slug, incident) => {
    const nodeIds = new Set(incident.nodes.map((n) => n.id));

    it("has unique node ids and valid edge endpoints", () => {
      expect(nodeIds.size).toBe(incident.nodes.length);
      for (const edge of incident.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    });

    it("has 8-12 timeline beats with monotonically increasing offsets", () => {
      expect(incident.timeline.length).toBeGreaterThanOrEqual(8);
      expect(incident.timeline.length).toBeLessThanOrEqual(12);
      for (let i = 1; i < incident.timeline.length; i++) {
        expect(incident.timeline[i].atSeconds).toBeGreaterThan(
          incident.timeline[i - 1].atSeconds,
        );
      }
    });

    it("every keyframe is a complete node-state snapshot with sane metrics", () => {
      for (const frame of incident.timeline) {
        for (const id of nodeIds) {
          expect(frame.nodeStates[id]).toMatch(/^(healthy|degraded|down)$/);
        }
        expect(frame.metrics.globalErrorRate).toBeGreaterThanOrEqual(0);
        expect(frame.metrics.globalErrorRate).toBeLessThanOrEqual(100);
        expect(frame.metrics.affectedUsers).toBeGreaterThanOrEqual(0);
        expect(frame.headline.length).toBeGreaterThan(0);
        expect(frame.narrative.length).toBeGreaterThan(40);
      }
    });

    it("starts healthy and ends recovered", () => {
      const first = incident.timeline[0];
      const last = incident.timeline[incident.timeline.length - 1];
      expect(Object.values(first.nodeStates).every((s) => s === "healthy")).toBe(true);
      expect(Object.values(last.nodeStates).every((s) => s === "healthy")).toBe(true);
      expect(last.metrics.globalErrorRate).toBe(0);
    });

    it("has 3-5 lessons", () => {
      expect(incident.lessons.length).toBeGreaterThanOrEqual(3);
      expect(incident.lessons.length).toBeLessThanOrEqual(5);
    });
  },
);

describe("facebook-bgp-2021 facts", () => {
  it("matches the public postmortem shape (~6h05m, 2021-10-04)", () => {
    const { meta, timeline } = FACEBOOK_BGP_2021;
    expect(meta.date).toBe("2021-10-04");
    expect(meta.durationLabel).toBe("6h 05m");
    expect(timeline[timeline.length - 1].atSeconds).toBe(6 * 3600 + 5 * 60);
    expect(meta.chaosEventIds).toEqual(["bgp-leak", "dns-failure"]);
  });

  it("peaks at total failure with 3.5B users affected", () => {
    const peak = FACEBOOK_BGP_2021.timeline.find(
      (f) => f.metrics.globalErrorRate === 100,
    );
    expect(peak).toBeDefined();
    expect(peak!.metrics.affectedUsers).toBe(3_500_000_000);
    expect(peak!.nodeStates["dns"]).toBe("down");
    expect(peak!.nodeStates["backbone"]).toBe("down");
  });
});
