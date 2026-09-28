import { expect, it } from "vitest";
import { nearestHandles } from "./nearestHandles";
import type { JitsukaNode } from "../domain/schema";
const node = (x: number, y: number): JitsukaNode => ({
  id: "node",
  type: "position",
  label: "Technique",
  position: { x, y },
});
it.each([
  [0, 250, "bottom", "top"],
  [0, -250, "top", "bottom"],
  [350, 0, "right", "left"],
  [-350, 0, "left", "right"],
])(
  "uses nearest sides for target at %s, %s",
  (x, y, sourceHandle, targetHandle) => {
    expect(nearestHandles(node(0, 0), node(Number(x), Number(y)))).toEqual({
      sourceHandle,
      targetHandle,
    });
  },
);
it("uses measured dimensions for tall nodes and updates after moving", () => {
  const source = node(0, 0),
    target = node(0, 500);
  expect(nearestHandles(source, target, { width: 190, height: 400 })).toEqual({
    sourceHandle: "bottom",
    targetHandle: "top",
  });
  target.position.y = -250;
  expect(nearestHandles(source, target, { width: 190, height: 400 })).toEqual({
    sourceHandle: "top",
    targetHandle: "bottom",
  });
});
