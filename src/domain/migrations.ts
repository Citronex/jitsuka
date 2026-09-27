import { gameMapSchema, safeUrl } from "../model";

// The pre-document app used { version: 1, nodes, edges }. Keep its local maps
// and exported files readable; future canonical versions get migrations here.
export function migrateDocument(input: unknown): unknown {
  if (!input || typeof input !== "object" || "format" in input) return input;
  const result = gameMapSchema.safeParse(input);
  if (!result.success) return input;
  const legacy = result.data;
  return {
    format: "jitsuka",
    schemaVersion: 1,
    metadata: { title: "My game plan" },
    nodes: legacy.nodes.map((node) => ({
      id: node.id,
      type: "technique",
      label: node.title,
      position: node.position,
      appearance: { shape: node.shape, color: node.color },
      links:
        node.url && safeUrl(node.url) ? [{ type: "video", url: node.url }] : [],
      ...(node.url && !safeUrl(node.url)
        ? { description: `Unfinished legacy reference: ${node.url}` }
        : {}),
    })),
    edges: legacy.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      appearance: {
        line: "solid",
        arrow: edge.kind === "arrow" ? "end" : "none",
        sourceAnchor: edge.sourceHandle || "bottom",
        targetAnchor: edge.targetHandle || "top",
      },
    })),
  };
}
