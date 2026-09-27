import { Handle, Position, type NodeProps } from "@xyflow/react";
import { safeUrl } from "../model";
import type { TechniqueFlowNode } from "../editor/documentToFlow";
export function TechniqueNode({
  data,
  selected,
}: NodeProps<TechniqueFlowNode>) {
  const linked = !!safeUrl(data.links?.[0]?.url);
  return (
    <div
      style={
        data.appearance?.color?.startsWith("#")
          ? { backgroundColor: data.appearance.color }
          : undefined
      }
      className={`technique ${data.appearance?.shape ?? "rounded"} ${data.appearance?.color ?? "blue"} ${selected ? "selected" : ""} ${data.connecting ? "connecting" : ""}`}
    >
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <span
        className={`technique-title${linked ? " technique-title-linked" : ""}`}
      >
        {data.label || "Untitled technique"}
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
