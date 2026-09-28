import { expect, it } from "vitest";
import { nodeTypes, type JitsukaNodeType } from "./schema";
import {
  parseJitsukaDocument,
  serializeJitsukaDocument,
} from "./serialization";
import { halfGuardFixture } from "./fixture";
import { NODE_STYLE_BY_TYPE } from "../editor/nodeShapes";
import {
  loadLocalJitsukaDocument,
  saveLocalJitsukaDocument,
  STORAGE_KEY,
  V1_STORAGE_KEY,
} from "../persistence/localJitsukaStorage";

it("assigns a unique permanent shape to each category", () => {
  expect(
    Object.fromEntries(
      Object.entries(NODE_STYLE_BY_TYPE).map(([type, style]) => [
        type,
        style.shape,
      ]),
    ),
  ).toEqual({
    guard: "pill",
    position: "rounded",
    pass: "parallelogram",
    sweep: "hexagon",
    submission: "diamond",
    escape: "octagon",
    takedown: "double-rectangle",
  });
  expect(
    new Set(Object.values(NODE_STYLE_BY_TYPE).map((style) => style.shape)).size,
  ).toBe(7);
});
it.each(nodeTypes)(
  "round-trips %s with links and descriptions, without redundant styling",
  (type) => {
    const doc = {
      ...halfGuardFixture,
      nodes: halfGuardFixture.nodes.map((node) => ({
        ...node,
        type,
        description: "Technique details",
      })),
    };
    const json = serializeJitsukaDocument(doc);
    expect(json).not.toContain('"shape"');
    expect(json).not.toContain('"color"');
    expect(parseJitsukaDocument(json)).toEqual(doc);
  },
);

const oldTypes = ["position", "technique", "reaction", "goal"] as const;
const oldDocument = {
  ...halfGuardFixture,
  schemaVersion: 1,
  nodes: oldTypes.map((type, i) => ({
    ...halfGuardFixture.nodes[1],
    id: `old-${i}`,
    type,
    label: type === "technique" ? "John Wayne Sweep" : `My ${type}`,
    description: "Keep these details",
    appearance: { color: "#123abc", shape: "circle" },
  })),
  edges: [
    {
      id: "old-edge",
      source: "old-0",
      target: "old-2",
      label: "opponent posts\nI win the underhook",
      appearance: { line: "dashed", arrow: "end" },
    },
  ],
};
it("migrates v1 without losing nodes, reactions, goals or connections", () => {
  const doc = parseJitsukaDocument(JSON.stringify(oldDocument));
  expect(doc.schemaVersion).toBe(3);
  expect(doc.nodes.map((node) => node.type)).toEqual([
    "position",
    "sweep",
    "position",
    "position",
  ]);
  for (const [index, node] of doc.nodes.entries()) {
    expect(node.id).toBe(oldDocument.nodes[index].id);
    expect(node.label).toBe(oldDocument.nodes[index].label);
    expect(node.position).toEqual(oldDocument.nodes[index].position);
    expect(node.description).toContain("Keep these details");
    expect(node.links).toEqual(oldDocument.nodes[index].links);
    expect(node).not.toHaveProperty("appearance");
  }
  expect(doc.nodes[2].description).toContain("Migrated from reaction");
  expect(doc.nodes[3].description).toContain("Migrated from goal");
  expect(doc.edges).toEqual(oldDocument.edges);
});
it.each<[string, JitsukaNodeType]>([
  ["Half Guard", "guard"],
  ["Deep Half", "guard"],
  ["John Wayne Sweep", "sweep"],
  ["Knee Cut", "pass"],
  ["Side Control", "position"],
  ["Armbar", "submission"],
  ["Upa Escape", "escape"],
  ["Single Leg", "takedown"],
  ["Unknown move", "position"],
])("migrates old technique %s to %s", (label, type) => {
  const doc = parseJitsukaDocument(
    JSON.stringify({
      ...oldDocument,
      nodes: [{ ...oldDocument.nodes[1], label }],
      edges: [],
    }),
  );
  expect(doc.nodes[0].type).toBe(type);
  if (label === "Unknown move")
    expect(doc.nodes[0].description).toContain("Migrated from technique");
});
it("rejects old categories in v3 while stripping redundant imported styling", () => {
  for (const type of ["technique", "reaction", "goal", "unknown"]) {
    expect(() =>
      parseJitsukaDocument(
        JSON.stringify({
          ...halfGuardFixture,
          nodes: [{ ...halfGuardFixture.nodes[0], type }],
          edges: [],
        }),
      ),
    ).toThrow();
  }
  const doc = parseJitsukaDocument(
    JSON.stringify({
      ...halfGuardFixture,
      nodes: halfGuardFixture.nodes.map((node) => ({
        ...node,
        appearance: { color: "green", shape: "circle" },
      })),
    }),
  );
  expect(doc.nodes[0]).not.toHaveProperty("appearance");
});
it("loads old local storage and saves v3 without erasing the old backup", () => {
  const oldJson = JSON.stringify(oldDocument);
  const values = new Map([[V1_STORAGE_KEY, oldJson]]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const doc = loadLocalJitsukaDocument(storage)!;
  saveLocalJitsukaDocument(doc, storage);
  expect(JSON.parse(values.get(STORAGE_KEY)!).schemaVersion).toBe(3);
  expect(values.get(V1_STORAGE_KEY)).toBe(oldJson);
  values.set(STORAGE_KEY, "broken");
  expect(() => loadLocalJitsukaDocument(storage)).toThrow();
});
