import type { JitsukaDocument } from "./schema";

export const halfGuardFixture: JitsukaDocument = {
  format: "jitsuka",
  schemaVersion: 3,
  metadata: {
    title: "Half guard game",
    description: "Connect the arm, then sweep.",
  },
  nodes: [
    {
      id: "half",
      type: "guard",
      label: "Half Guard",
      description: "Start here",
      position: { x: 200, y: 0 },
    },
    {
      id: "sweep",
      type: "sweep",
      label: "John Wayne Sweep",
      position: { x: 200, y: 220 },
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

export const sampleMap: JitsukaDocument = {
  ...halfGuardFixture,
  metadata: { title: "My game plan" },
  nodes: [
    { ...halfGuardFixture.nodes[0], position: { x: 320, y: 50 } },
    { ...halfGuardFixture.nodes[1], position: { x: 70, y: 290 } },
    {
      id: "underhook",
      type: "position",
      label: "Underhook",
      position: { x: 585, y: 270 },
    },
    {
      id: "top",
      type: "position",
      label: "Top Half Guard",
      position: { x: 70, y: 530 },
    },
    {
      id: "dogfight",
      type: "position",
      label: "Dogfight",
      position: { x: 585, y: 530 },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "half",
      target: "sweep",
      label: "Same-side arm connection",
      appearance: { line: "solid", arrow: "end" },
    },
    {
      id: "e2",
      source: "half",
      target: "underhook",
      label: "Opponent posts hand",
      appearance: { line: "solid", arrow: "end" },
    },
    {
      id: "e3",
      source: "sweep",
      target: "top",
      label: "Sweep succeeds",
      appearance: { line: "solid", arrow: "end" },
    },
    {
      id: "e4",
      source: "underhook",
      target: "dogfight",
      label: "I win head position",
      appearance: { line: "solid", arrow: "end" },
    },
  ],
};
