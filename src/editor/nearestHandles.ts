import type { JitsukaNode } from "../domain/schema";

type Size = { width: number; height: number };
function anchors(node: JitsukaNode, measured?: Size) {
  const shape = node.appearance?.shape;
  const { width, height } =
    measured ??
    (shape === "circle"
      ? { width: 130, height: 130 }
      : shape === "diamond"
        ? { width: 150, height: 150 }
        : { width: 190, height: 82 });
  const { x, y } = node.position;
  return [
    { id: "top", x: x + width / 2, y },
    { id: "bottom", x: x + width / 2, y: y + height },
    { id: "left", x, y: y + height / 2 },
    { id: "right", x: x + width, y: y + height / 2 },
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
