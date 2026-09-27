import { MarkerType, type Node } from "@xyflow/react";
import type { JitsukaDocument, JitsukaNode } from "../domain/schema";
import { nearestHandles } from "./nearestHandles";
export type TechniqueFlowNode = Node<
  JitsukaNode & { presentation: boolean; connecting: boolean },
  "technique"
>;
export function documentToFlow(
  document: JitsukaDocument,
  options: {
    presentation: boolean;
    selectedId?: string;
    start: string | null;
    measurements: Record<string, { width: number; height: number }>;
  },
) {
  const nodes: TechniqueFlowNode[] = document.nodes.map((node) => ({
    id: node.id,
    type: "technique",
    position: node.position,
    measured: options.measurements[node.id],
    data: {
      ...node,
      presentation: options.presentation,
      connecting: options.start === node.id,
    },
    selected: !options.presentation && options.selectedId === node.id,
    ariaLabel: node.label,
  }));
  const byId = new Map(document.nodes.map((node) => [node.id, node]));
  const edges = document.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "default",
    ...nearestHandles(
      byId.get(edge.source)!,
      byId.get(edge.target)!,
      options.measurements[edge.source],
      options.measurements[edge.target],
    ),
    selected: !options.presentation && options.selectedId === edge.id,
    markerEnd:
      edge.appearance?.arrow === "end"
        ? { type: MarkerType.ArrowClosed, color: "#62685f" }
        : undefined,
    label: edge.label
      ? edge.label.split("\n").map((line, index) => (
          <tspan key={index} x={0} y={12 + index * 18}>
            {line || "\u00a0"}
          </tspan>
        ))
      : undefined,
    interactionWidth: 28,
    style: {
      strokeWidth: 2,
      stroke: "#62685f",
      strokeDasharray: edge.appearance?.line === "dashed" ? "6 5" : undefined,
    },
    labelStyle: { fontSize: 12, fontWeight: 600, fill: "#444b40" },
    labelBgStyle: { fill: "#f7f8f3" },
    labelBgPadding: [10, 7] as [number, number],
    labelBgBorderRadius: 6,
  }));
  return { nodes, edges };
}
