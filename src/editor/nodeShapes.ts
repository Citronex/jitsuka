import type { JitsukaNodeType } from "../domain/schema";

export const NODE_STYLE_BY_TYPE = {
  guard: {
    shape: "pill",
    backgroundColor: "#E0ECF7",
    textColor: "#253027",
    borderColor: "#8796A3",
  },
  position: {
    shape: "rounded",
    backgroundColor: "#E5E9EE",
    textColor: "#253027",
    borderColor: "#8A95A3",
  },
  pass: {
    shape: "parallelogram",
    backgroundColor: "#F8ECC6",
    textColor: "#253027",
    borderColor: "#A99D72",
  },
  sweep: {
    shape: "hexagon",
    backgroundColor: "#E3EFDA",
    textColor: "#253027",
    borderColor: "#8D9B80",
  },
  submission: {
    shape: "diamond",
    backgroundColor: "#F5DEDE",
    textColor: "#253027",
    borderColor: "#AF8C8C",
  },
  escape: {
    shape: "octagon",
    backgroundColor: "#DCEFEA",
    textColor: "#253027",
    borderColor: "#809F96",
  },
  takedown: {
    shape: "double-rectangle",
    backgroundColor: "#ECE3F5",
    textColor: "#253027",
    borderColor: "#9A8DA8",
  },
} as const satisfies Record<
  JitsukaNodeType,
  {
    shape: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  }
>;

// SVG coordinates and side-handle offsets share the same geometry.
export const SHAPE_GEOMETRY = {
  pill: { width: 190, height: 82, inset: 0, points: undefined, radius: 50 },
  rounded: { width: 190, height: 82, inset: 0, points: undefined, radius: 8 },
  parallelogram: {
    width: 190,
    height: 100,
    inset: 8,
    points: "16,0 100,0 84,100 0,100",
    radius: 0,
  },
  hexagon: {
    width: 190,
    height: 100,
    inset: 0,
    points: "18,0 82,0 100,50 82,100 18,100 0,50",
    radius: 0,
  },
  diamond: {
    width: 170,
    height: 150,
    inset: 0,
    points: "50,0 100,50 50,100 0,50",
    radius: 0,
  },
  octagon: {
    width: 190,
    height: 110,
    inset: 0,
    points: "20,0 80,0 100,20 100,80 80,100 20,100 0,80 0,20",
    radius: 0,
  },
  "double-rectangle": {
    width: 190,
    height: 90,
    inset: 0,
    points: undefined,
    radius: 0,
  },
} as const;
