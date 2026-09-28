import { z } from "zod";
import { colors, shapes, safeUrl } from "../model";

export const nodeTypes = [
  "guard",
  "position",
  "pass",
  "sweep",
  "submission",
  "escape",
  "takedown",
] as const;
export type JitsukaNodeType = (typeof nodeTypes)[number];
export const linkSchema = z.object({
  type: z.enum(["video", "article", "other"]),
  url: z
    .string()
    .trim()
    .refine((value) => !!safeUrl(value), "Use a complete http or https URL."),
  label: z.string().optional(),
});
export const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(nodeTypes),
  label: z.string(),
  description: z.string().optional(),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  links: z.array(linkSchema).optional(),
});
export const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  appearance: z
    .object({
      line: z.enum(["solid", "dashed"]).optional(),
      arrow: z.enum(["none", "end"]).optional(),
      sourceAnchor: z.enum(["top", "bottom"]).optional(),
      targetAnchor: z.enum(["top", "bottom"]).optional(),
    })
    .optional(),
});
const documentSchema = z.object({
  format: z.literal("jitsuka"),
  schemaVersion: z.literal(3),
  metadata: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  viewport: z
    .object({
      x: z.number().finite(),
      y: z.number().finite(),
      zoom: z.number().finite().positive(),
    })
    .optional(),
});
function validateReferences(
  doc: {
    nodes: { id: string }[];
    edges: { id: string; source: string; target: string }[];
  },
  ctx: z.RefinementCtx,
) {
  const ids = new Set(doc.nodes.map((node) => node.id));
  if (
    ids.size !== doc.nodes.length ||
    new Set(doc.edges.map((edge) => edge.id)).size !== doc.edges.length
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Node and edge IDs must be unique.",
    });
  }
  if (
    doc.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target))
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Connections must reference existing nodes.",
    });
  }
}
export const jitsukaDocumentSchema =
  documentSchema.superRefine(validateReferences);
// Validate the old format before migrating; malformed imports never become valid by accident.
const legacyColorSchema = z
  .string()
  .refine(
    (value) =>
      colors.some((color) => color === value) || /^#[0-9a-f]{6}$/i.test(value),
    "Unsupported color.",
  )
  .optional();
export const v2DocumentSchema = documentSchema
  .extend({
    schemaVersion: z.literal(2),
    nodes: z.array(
      nodeSchema.extend({
        appearance: z.object({ color: legacyColorSchema }).optional(),
      }),
    ),
  })
  .superRefine(validateReferences);
export const v1DocumentSchema = documentSchema
  .extend({
    schemaVersion: z.literal(1),
    nodes: z.array(
      nodeSchema.extend({
        type: z.enum(["position", "technique", "reaction", "goal"]),
        appearance: z
          .object({
            color: legacyColorSchema,
            shape: z.enum(shapes).optional(),
          })
          .optional(),
      }),
    ),
  })
  .superRefine(validateReferences);
export type JitsukaDocument = z.infer<typeof jitsukaDocumentSchema>;
export type JitsukaNode = z.infer<typeof nodeSchema>;
export type JitsukaEdge = z.infer<typeof edgeSchema>;
export type JitsukaLink = z.infer<typeof linkSchema>;
export function blankDocument(): JitsukaDocument {
  return {
    format: "jitsuka",
    schemaVersion: 3,
    metadata: { title: "My game plan" },
    nodes: [],
    edges: [],
  };
}
