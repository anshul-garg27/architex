import { describe, it, expect } from "vitest";
import { parseChatStreamFrame } from "@/hooks/useDrillInterviewer";

/**
 * Logic-level tests. The streaming + EventSource path lives behind a hook
 * that can't be reliably tested under React 19 + testing-library's act
 * shim; the underlying parsers are exported and exercised here instead.
 */

describe("parseChatStreamFrame", () => {
  it("parses a delta frame", () => {
    const msg = parseChatStreamFrame(
      JSON.stringify({ type: "delta", text: "hi" }),
    );
    expect(msg).toEqual({ type: "delta", text: "hi" });
  });

  it("parses a done frame", () => {
    const msg = parseChatStreamFrame(JSON.stringify({ type: "done" }));
    expect(msg?.type).toBe("done");
  });

  it("parses an error frame", () => {
    const msg = parseChatStreamFrame(
      JSON.stringify({ type: "error", error: "oops" }),
    );
    expect(msg).toEqual({ type: "error", error: "oops" });
  });

  it("returns null for unrecognised shape", () => {
    expect(parseChatStreamFrame("{}")).toBeNull();
    expect(parseChatStreamFrame(JSON.stringify({ type: "weird" }))).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseChatStreamFrame("not json")).toBeNull();
  });
});
