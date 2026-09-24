import { describe, expect, it } from "vitest";
import { loadMap, saveMap, STORAGE_KEY } from "./storage";
import { removeTechnique, safeUrl, sampleMap } from "./model";
function memoryStorage(raw: string | null = null) {
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}
describe("local map persistence", () => {
  it("loads the sample only for a new map", () => {
    expect(loadMap(memoryStorage()).map).toEqual(sampleMap);
  });
  it("round trips labels, URLs, shapes and positions", () => {
    const storage = memoryStorage();
    expect(saveMap(storage, sampleMap)).toBeNull();
    expect(loadMap(storage).map).toEqual(sampleMap);
  });
  it("preserves an intentionally empty map after reload", () => {
    const map = { version: 1 as const, nodes: [], edges: [] };
    const storage = memoryStorage();
    saveMap(storage, map);
    expect(loadMap(storage).map).toEqual(map);
  });
  it("does not overwrite corrupt or incompatible data", () => {
    for (const raw of [
      "broken",
      JSON.stringify({ ...sampleMap, version: 2 }),
      JSON.stringify({ ...sampleMap, nodes: [] }),
    ]) {
      const storage = memoryStorage(raw);
      expect(loadMap(storage).error).toBeTruthy();
      expect(storage.getItem()).toBe(raw);
    }
  });
  it("reports storage failures", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    };
    expect(saveMap(storage, sampleMap)).toBeTruthy();
  });
});
describe("map operations", () => {
  it("removes attached connections with a technique", () => {
    const map = removeTechnique(sampleMap, "half");
    expect(map.nodes.some((n) => n.id === "half")).toBe(false);
    expect(map.edges.map((e) => e.id)).toEqual(["e3", "e4"]);
    expect(sampleMap.nodes).toHaveLength(5);
  });
  it("opens only complete web URLs", () => {
    expect(safeUrl("https://youtube.com/watch?v=test")).toBe(
      "https://youtube.com/watch?v=test",
    );
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,test",
      "",
      "youtube.com",
    ])
      expect(safeUrl(value)).toBeNull();
  });
});
