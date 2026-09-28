import type { JitsukaNode } from "../domain/schema";
import { NODE_STYLE_BY_TYPE, SHAPE_GEOMETRY } from "./nodeShapes";

type Size = { width: number; height: number };
function anchors(node: JitsukaNode, measured?: Size) {
  const geometry = SHAPE_GEOMETRY[NODE_STYLE_BY_TYPE[node.type].shape];
  const { width, height } = measured ?? geometry;
  const { x, y } = node.position;
  return [
    { id: "top", x: x + width / 2, y },
    { id: "bottom", x: x + width / 2, y: y + height },
    { id: "left", x: x + (width * geometry.inset) / 100, y: y + height / 2 },
    {
      id: "right",
      x: x + width * (1 - geometry.inset / 100),
      y: y + height / 2,
    },
  ];
}

export function nearestHandles(
  source: JitsukaNode,
  target: JitsukaNode,
  sourceSize?: Size,
  targetSize?: Size,
) {
  let distance = Infinity;
  let result = { sourceHandle: "bottom", targetHandle: "top" };
  for (const from of anchors(source, sourceSize)) {
    for (const to of anchors(target, targetSize)) {
      const candidate = (from.x - to.x) ** 2 + (from.y - to.y) ** 2;
      if (candidate < distance) {
        distance = candidate;
        result = { sourceHandle: from.id, targetHandle: to.id };
      }
    }
  }
  return result;
}
