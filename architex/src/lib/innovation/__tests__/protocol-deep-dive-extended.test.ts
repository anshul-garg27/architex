import { describe, it, expect } from "vitest";
import {
  PROTOCOLS,
  PROTOCOL_SLUGS,
  getProtocol,
  compareProtocols,
  type ProtocolDefinition,
  type HeaderField,
} from "@/lib/innovation/protocol-deep-dive";

// -- All 10 protocols complete ---------------------------------

describe("protocol-deep-dive extended: completeness", () => {
  const expectedSlugs = [
    "tcp",
    "http-2",
    "http-3",
    "grpc",
    "websocket",
    "tls",
    "dns",
    "mqtt",
    "amqp",
    "graphql",
  ];

  it("defines exactly 10 protocol slugs", () => {
    expect(PROTOCOL_SLUGS).toHaveLength(10);
  });

  it.each(expectedSlugs)("slug '%s' exists in PROTOCOLS", (slug) => {
    expect(PROTOCOLS[slug]).toBeDefined();
    expect(PROTOCOLS[slug].name.length).toBeGreaterThan(0);
  });

  it("all 10 expected slugs are present", () => {
    for (const slug of expectedSlugs) {
      expect(PROTOCOL_SLUGS).toContain(slug);
    }
  });

  it("every protocol has at least 4 use cases", () => {
    for (const slug of PROTOCOL_SLUGS) {
      expect(PROTOCOLS[slug].useCases.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("every protocol has at least 4 tradeoffs", () => {
    for (const slug of PROTOCOL_SLUGS) {
      expect(PROTOCOLS[slug].tradeoffs.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("all protocol names are non-empty and unique", () => {
    const names = PROTOCOL_SLUGS.map((s) => PROTOCOLS[s].name);
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
    }
    expect(new Set(names).size).toBe(names.length);
  });
});

// -- Comparison function ----------------------------------------

describe("protocol-deep-dive extended: compareProtocols", () => {
  it("returns a valid comparison for tcp vs http-3", () => {
    const result = compareProtocols("tcp", "http-3");
    expect(result).not.toBeNull();
    expect(result!.protocolA.name).toBe("TCP");
    expect(result!.protocolB.name).toBe("HTTP/3");
    expect(result!.headerCountA).toBeGreaterThan(0);
    expect(result!.headerCountB).toBeGreaterThan(0);
  });

  it("returns null when both slugs are invalid", () => {
    expect(compareProtocols("foo", "bar")).toBeNull();
  });

  it("comparison header counts match actual header arrays", () => {
    const result = compareProtocols("grpc", "websocket");
    expect(result).not.toBeNull();
    expect(result!.headerCountA).toBe(PROTOCOLS["grpc"].headerFields.length);
    expect(result!.headerCountB).toBe(
      PROTOCOLS["websocket"].headerFields.length,
    );
  });

  it("comparison handshake step counts match actual arrays", () => {
    const result = compareProtocols("mqtt", "amqp");
    expect(result).not.toBeNull();
    expect(result!.handshakeStepsA).toBe(
      PROTOCOLS["mqtt"].handshakeSteps.length,
    );
    expect(result!.handshakeStepsB).toBe(
      PROTOCOLS["amqp"].handshakeSteps.length,
    );
  });

  it("compareProtocols works with same slug on both sides", () => {
    const result = compareProtocols("dns", "dns");
    expect(result).not.toBeNull();
    expect(result!.protocolA).toBe(result!.protocolB);
  });

  it("returns null if only slugA is invalid", () => {
    expect(compareProtocols("invalid", "tcp")).toBeNull();
  });

  it("returns null if only slugB is invalid", () => {
    expect(compareProtocols("tcp", "invalid")).toBeNull();
  });
});

// -- Header fields deep checks ---------------------------------

describe("protocol-deep-dive extended: header fields", () => {
  it.each(PROTOCOL_SLUGS)(
    "%s: every header field has a non-empty name, purpose, and example",
    (slug) => {
      for (const field of PROTOCOLS[slug].headerFields) {
        expect(field.name.length).toBeGreaterThan(0);
        expect(field.purpose.length).toBeGreaterThan(0);
        expect(field.exampleValue.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(PROTOCOL_SLUGS)(
    "%s: sizeBytes is a non-negative number for every field",
    (slug) => {
      for (const field of PROTOCOLS[slug].headerFields) {
        expect(typeof field.sizeBytes).toBe("number");
        expect(field.sizeBytes).toBeGreaterThanOrEqual(0);
      }
    },
  );

  it("TCP has the standard Source Port and Destination Port fields", () => {
    const tcp = getProtocol("tcp")!;
    const names = tcp.headerFields.map((f) => f.name);
    expect(names).toContain("Source Port");
    expect(names).toContain("Destination Port");
  });

  it("HTTP/2 has the Stream Identifier field", () => {
    const http2 = getProtocol("http-2")!;
    const names = http2.headerFields.map((f) => f.name);
    expect(names).toContain("Stream Identifier");
  });

  it("TLS has the AEAD Tag field", () => {
    const tls = getProtocol("tls")!;
    const names = tls.headerFields.map((f) => f.name);
    expect(names).toContain("AEAD Tag");
  });
});

// -- getProtocol -----------------------------------------------

describe("protocol-deep-dive extended: getProtocol", () => {
  it.each(PROTOCOL_SLUGS)("getProtocol('%s') returns a definition", (slug) => {
    const p = getProtocol(slug);
    expect(p).toBeDefined();
    expect(p!.name.length).toBeGreaterThan(0);
  });

  it("getProtocol returns undefined for empty string", () => {
    expect(getProtocol("")).toBeUndefined();
  });

  it("getProtocol returns undefined for random slug", () => {
    expect(getProtocol("zig-zag-protocol")).toBeUndefined();
  });
});

// -- Handshake steps -------------------------------------------

describe("protocol-deep-dive extended: handshake steps", () => {
  it.each(PROTOCOL_SLUGS)(
    "%s: handshake steps are numbered sequentially from 1",
    (slug) => {
      const steps = PROTOCOLS[slug].handshakeSteps;
      steps.forEach((s, i) => {
        expect(s.step).toBe(i + 1);
      });
    },
  );

  it("TCP has exactly 3 handshake steps (3-way handshake)", () => {
    expect(PROTOCOLS["tcp"].handshakeSteps).toHaveLength(3);
  });

  it("AMQP has the most handshake steps (6)", () => {
    const max = Math.max(
      ...PROTOCOL_SLUGS.map((s) => PROTOCOLS[s].handshakeSteps.length),
    );
    expect(PROTOCOLS["amqp"].handshakeSteps.length).toBe(max);
  });
});

// -- Performance characteristics --------------------------------

describe("protocol-deep-dive extended: performance", () => {
  it.each(PROTOCOL_SLUGS)(
    "%s: all 4 performance fields are populated strings",
    (slug) => {
      const perf = PROTOCOLS[slug].performanceCharacteristics;
      expect(typeof perf.latencyMs).toBe("string");
      expect(perf.latencyMs.length).toBeGreaterThan(0);
      expect(typeof perf.throughput).toBe("string");
      expect(perf.throughput.length).toBeGreaterThan(0);
      expect(typeof perf.overhead).toBe("string");
      expect(perf.overhead.length).toBeGreaterThan(0);
      expect(typeof perf.connectionSetupTime).toBe("string");
      expect(perf.connectionSetupTime.length).toBeGreaterThan(0);
    },
  );
});

// -- Layers (OSI) -----------------------------------------------

describe("protocol-deep-dive extended: OSI layers", () => {
  it("TCP maps to Transport layer", () => {
    expect(PROTOCOLS["tcp"].layers).toContain("Transport (Layer 4)");
  });

  it("GraphQL maps to Application layer", () => {
    const gql = PROTOCOLS["graphql"];
    expect(gql.layers.some((l) => l.includes("Application"))).toBe(true);
  });

  it("TLS maps to Presentation/Session layers", () => {
    const tls = PROTOCOLS["tls"];
    expect(tls.layers.some((l) => l.includes("Presentation"))).toBe(true);
  });
});
