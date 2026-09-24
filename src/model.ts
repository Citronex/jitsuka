import { z } from "zod";
export const shapes = ["rounded", "pill", "diamond", "circle"] as const;
export const colors = ["blue", "green", "amber", "purple"] as const;
export const techniqueSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  url: z.string().optional(),
  shape: z.enum(shapes),
  color: z.enum(colors),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
});
export const connectionSchema = z.object({
  id: z.string().min(1),
  source: z.string(),
  target: z.string(),
  kind: z.enum(["line", "arrow"]),
  label: z.string().optional(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
});
export const gameMapSchema = z
  .object({
    version: z.literal(1),
    nodes: z.array(techniqueSchema),
    edges: z.array(connectionSchema),
  })
  .superRefine((map, ctx) => {
    const ids = new Set(map.nodes.map((n) => n.id));
    if (
      ids.size !== map.nodes.length ||
      new Set(map.edges.map((e) => e.id)).size !== map.edges.length ||
      map.edges.some((e) => !ids.has(e.source) || !ids.has(e.target))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Map contains duplicate IDs or missing endpoints.",
      });
    }
  });
export type Technique = z.infer<typeof techniqueSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type GameMap = z.infer<typeof gameMapSchema>;
export function removeTechnique(map: GameMap, id: string): GameMap {
  return {
    ...map,
    nodes: map.nodes.filter((n) => n.id !== id),
    edges: map.edges.filter((e) => e.source !== id && e.target !== id),
  };
}
export function safeUrl(value?: string): string | null {
  try {
    const url = new URL(value || "");
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export const sampleMap: GameMap = {
  version: 1,
  nodes: [
    {
      id: "half",
      title: "Half Guard",
      shape: "rounded",
      color: "blue",
      position: { x: 320, y: 50 },
    },
    {
      id: "sweep",
      title: "John Wayne Sweep",
      shape: "pill",
      color: "green",
      position: { x: 70, y: 290 },
      url: "https://www.youtube.com/results?search_query=bjj+john+wayne+sweep",
    },
    {
      id: "underhook",
      title: "Underhook",
      shape: "diamond",
      color: "amber",
      position: { x: 585, y: 270 },
    },
    {
      id: "top",
      title: "Top Half Guard",
      shape: "rounded",
      color: "blue",
      position: { x: 70, y: 530 },
    },
    {
      id: "dogfight",
      title: "Dogfight",
      shape: "pill",
      color: "purple",
      position: { x: 565, y: 530 },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "half",
      target: "sweep",
      kind: "arrow",
      label: "Same-side arm connection",
    },
    {
      id: "e2",
      source: "half",
      target: "underhook",
      kind: "arrow",
      label: "Opponent posts hand",
    },
    {
      id: "e3",
      source: "sweep",
      target: "top",
      kind: "arrow",
      label: "Come up on top",
    },
    {
      id: "e4",
      source: "underhook",
      target: "dogfight",
      kind: "arrow",
      label: "Win head position",
    },
  ],
};
