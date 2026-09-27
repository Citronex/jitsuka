import { describe, expect, it, vi } from "vitest";
import { halfGuardFixture } from "./fixture";
import { blankDocument } from "./schema";
import {
  parseJitsukaDocument,
  serializeJitsukaDocument,
  tryRollDocument,
} from "./serialization";
import {
  createAutosave,
  loadLocalJitsukaDocument,
  saveLocalJitsukaDocument,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from "../persistence/localJitsukaStorage";
import { sampleMap } from "../model";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("portable documents", () => {
  it("parses and pretty-prints without losing meaningful data", () => {
    const document = {
      ...halfGuardFixture,
      viewport: { x: 10, y: 20, zoom: 1.2 },
    };
    const json = serializeJitsukaDocument(document);
    expect(json).toContain('\n  "format": "jitsuka"');
    expect(parseJitsukaDocument(json)).toEqual(document);
  });
  it.each([
    "{",
    "null",
    "{}",
    JSON.stringify({ ...halfGuardFixture, format: "other" }),
    JSON.stringify({ ...halfGuardFixture, schemaVersion: 2 }),
    JSON.stringify({
      ...halfGuardFixture,
      nodes: [{ ...halfGuardFixture.nodes[0], type: "bogus" }],
    }),
    JSON.stringify({ ...halfGuardFixture, nodes: [] }),
    JSON.stringify({
      ...halfGuardFixture,
      nodes: [...halfGuardFixture.nodes, halfGuardFixture.nodes[0]],
    }),
    JSON.stringify({
      ...halfGuardFixture,
      edges: [...halfGuardFixture.edges, halfGuardFixture.edges[0]],
    }),
    JSON.stringify({
      ...halfGuardFixture,
      nodes: [{ ...halfGuardFixture.nodes[0], position: { x: null, y: 0 } }],
    }),
    JSON.stringify({
      ...halfGuardFixture,
      nodes: [
        {
          ...halfGuardFixture.nodes[0],
          links: [{ type: "video", url: "javascript:alert(1)" }],
        },
      ],
    }),
  ])(
    "rejects malformed or invalid input without replacing the map: %s",
    (input) => {
      expect(() => parseJitsukaDocument(input)).toThrow();
      const result = tryRollDocument(input, halfGuardFixture);
      expect(result.document).toBe(halfGuardFixture);
      expect(result.error).toContain("Couldn't roll");
    },
  );
  it("strips editor internals and rejects non-finite positions", () => {
    const input = { ...halfGuardFixture, selected: true };
    expect(parseJitsukaDocument(JSON.stringify(input))).not.toHaveProperty(
      "selected",
    );
    expect(() =>
      serializeJitsukaDocument({
        ...halfGuardFixture,
        nodes: [
          { ...halfGuardFixture.nodes[0], position: { x: Infinity, y: 0 } },
        ],
      }),
    ).toThrow();
  });
  it("migrates legacy maps including links and connection anchors", () => {
    const doc = parseJitsukaDocument(JSON.stringify(sampleMap));
    expect(doc.nodes.map((n) => n.label)).toEqual(
      sampleMap.nodes.map((n) => n.title),
    );
    expect(doc.nodes[1].links?.[0].url).toBe(sampleMap.nodes[1].url);
    expect(doc.edges[0].appearance?.arrow).toBe("end");
    expect(parseJitsukaDocument(serializeJitsukaDocument(doc))).toEqual(doc);
  });
});
describe("local persistence", () => {
  it("starts blank and round-trips a document including an intentionally blank map", () => {
    const port = storage();
    expect(loadLocalJitsukaDocument(port)).toBeNull();
    for (const doc of [halfGuardFixture, blankDocument()]) {
      saveLocalJitsukaDocument(doc, port);
      expect(loadLocalJitsukaDocument(port)).toEqual(doc);
    }
  });
  it("does not overwrite corrupt data or fall back to a stale legacy map", () => {
    const port = storage();
    port.setItem(LEGACY_STORAGE_KEY, JSON.stringify(sampleMap));
    expect(loadLocalJitsukaDocument(port)?.format).toBe("jitsuka");
    port.setItem(STORAGE_KEY, "broken");
    expect(() => loadLocalJitsukaDocument(port)).toThrow();
    expect(port.getItem(STORAGE_KEY)).toBe("broken");
  });
  it("coalesces drag updates, flushes pending work, and reports write failures", () => {
    vi.useFakeTimers();
    try {
      const save = vi.fn();
      const report = vi.fn();
      const autosave = createAutosave(save, report);
      autosave.schedule(halfGuardFixture);
      vi.advanceTimersByTime(200);
      autosave.schedule(blankDocument());
      vi.advanceTimersByTime(200);
      expect(save).not.toHaveBeenCalled();
      autosave.flush();
      expect(save).toHaveBeenCalledExactlyOnceWith(blankDocument());
      save.mockImplementation(() => {
        throw new Error("quota");
      });
      autosave.schedule(halfGuardFixture);
      vi.advanceTimersByTime(400);
      expect(report).toHaveBeenLastCalledWith(
        expect.stringContaining("Could not save"),
      );
      autosave.cancel();
    } finally {
      vi.useRealTimers();
    }
  });
});
