import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { safeUrl, type Technique } from "../model";
export type TechniqueFlowNode = Node<
  Technique & { presentation: boolean; connecting: boolean },
  "technique"
>;
export function TechniqueNode({
  data,
  selected,
}: NodeProps<TechniqueFlowNode>) {
  const linked = !!safeUrl(data.url);
  return (
    <div
      className={`technique ${data.shape} ${data.color} ${selected ? "selected" : ""} ${data.connecting ? "connecting" : ""}`}
    >
      <Handle type="target" position={Position.Top} id="top" />
      <span className={`technique-title${linked ? " technique-title-linked" : ""}`}>
        {data.title || "Untitled technique"}
      </span>
      {linked && (
        <span className="link-mark" aria-label="Has reference link">
          ↗
        </span>
      )}
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}
