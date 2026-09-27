import type { JitsukaDocument } from "./schema";

export const halfGuardFixture: JitsukaDocument = {
  format: "jitsuka",
  schemaVersion: 1,
  metadata: {
    title: "Half guard game",
    description: "Connect the arm, then sweep.",
  },
  nodes: [
    {
      id: "half",
      type: "position",
      label: "Half Guard",
      description: "Start here",
      position: { x: 200, y: 0 },
      appearance: { shape: "rounded", color: "blue" },
    },
    {
      id: "sweep",
      type: "technique",
      label: "John Wayne Sweep",
      position: { x: 200, y: 220 },
      appearance: { shape: "pill", color: "green" },
      links: [
        {
          type: "video",
          url: "https://www.youtube.com/results?search_query=john+wayne+sweep",
          label: "Sweep instructionals",
        },
        {
          type: "article",
          url: "https://en.wikipedia.org/wiki/Brazilian_jiu-jitsu",
          label: "Reference",
        },
      ],
    },
  ],
  edges: [
    {
      id: "connection",
      source: "half",
      target: "sweep",
      label: "same-side arm connection",
      appearance: { line: "solid", arrow: "end" },
    },
  ],
};
