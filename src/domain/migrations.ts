import { gameMapSchema, safeUrl } from "../model";
import {
  v1DocumentSchema,
  v2DocumentSchema,
  type JitsukaNodeType,
} from "./schema";

// Conservative name hints for old generic techniques. Never infer from color/shape.
function inferCategory(label: string): JitsukaNodeType | undefined {
  const name = label.trim().toLowerCase();
  if (/\b(sweep)\b/.test(name)) return "sweep";
  if (/\b(escape|sit[- ]out|upa|kipping)\b/.test(name)) return "escape";
  if (
    /\b(armbar|triangle|baratoplata|omoplata|kimura|americana|choke|heel hook|kneebar)\b/.test(
      name,
    )
  )
    return "submission";
  if (/\b(pass|knee cut|toreando)\b/.test(name)) return "pass";
  if (/\b(takedown|single leg|double leg|ankle pick)\b/.test(name))
    return "takedown";
  if (
    /^(half guard|deep half|closed guard|open guard|de la riva|butterfly guard|x guard|spider guard|lasso guard)$/.test(
      name,
    )
  )
    return "guard";
  return undefined;
}

function migrateV1(input: unknown): unknown {
  const result = v1DocumentSchema.safeParse(input);
  if (!result.success) return input;
  return {
    ...result.data,
    schemaVersion: 2,
    nodes: result.data.nodes.map((node) => {
      const inferred =
        node.type === "technique" ? inferCategory(node.label) : undefined;
      // Position is the least prescriptive fallback. Preserve former reaction/goal
      // intent and ambiguous techniques in description rather than discarding nodes.
      const note =
        node.type !== "position" && !inferred
          ? `Migrated from ${node.type}; review the category.`
          : undefined;
      return {
        ...node,
        type: inferred ?? "position",
        description: note
          ? [node.description, note].filter(Boolean).join("\n\n")
          : node.description,
        appearance: node.appearance
          ? { color: node.appearance.color }
          : undefined,
      };
    }),
  };
}

// The pre-document app used { version: 1, nodes, edges }. Keep its local maps
// and exported files readable; future canonical versions get migrations here.
function migrateV2(input: unknown): unknown {
  const result = v2DocumentSchema.safeParse(input);
  if (!result.success) return input;
  return {
    ...result.data,
    schemaVersion: 3,
    nodes: result.data.nodes.map(
      ({ appearance: _appearance, ...node }) => node,
    ),
  };
}
export function migrateDocument(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  if ("format" in input) return migrateV2(migrateV1(input));
  const result = gameMapSchema.safeParse(input);
  if (!result.success) return input;
  const legacy = result.data;
  return migrateV2(
    migrateV1({
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
          node.url && safeUrl(node.url)
            ? [{ type: "video", url: node.url }]
            : [],
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
    }),
  );
}
