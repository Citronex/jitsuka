import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { useEffect } from "react";
import { safeUrl } from "../model";
import type { TechniqueFlowNode } from "../editor/documentToFlow";
import { NODE_STYLE_BY_TYPE, SHAPE_GEOMETRY } from "../editor/nodeShapes";
export function TechniqueNode({
  id,
  data,
  selected,
}: NodeProps<TechniqueFlowNode>) {
  const linked = !!safeUrl(data.links?.[0]?.url);
  const semanticStyle = NODE_STYLE_BY_TYPE[data.type];
  const shape = semanticStyle.shape;
  const geometry = SHAPE_GEOMETRY[shape];
  const updateInternals = useUpdateNodeInternals();
  useEffect(() => {
    const frame = requestAnimationFrame(() => updateInternals(id));
    return () => cancelAnimationFrame(frame);
  }, [id, data.type, updateInternals]);
  return (
    <div
      style={{
        width: geometry.width,
        minHeight: geometry.height,
        color: semanticStyle.textColor,
      }}
      className={`technique ${shape} ${selected ? "selected" : ""} ${data.connecting ? "connecting" : ""}`}
      data-category={data.type}
      title={data.type[0].toUpperCase() + data.type.slice(1)}
    >
      <svg
        className="technique-shape"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          fill: semanticStyle.backgroundColor,
          stroke: semanticStyle.borderColor,
        }}
      >
        {geometry.points ? (
          <polygon points={geometry.points} />
        ) : (
          <rect x="0" y="0" width="100" height="100" rx={geometry.radius} />
        )}
        {shape === "double-rectangle" && (
          <rect x="4" y="8" width="92" height="84" fill="none" />
        )}
      </svg>
      <Handle type="source" position={Position.Top} id="top" />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ left: `${geometry.inset}%` }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ right: `${geometry.inset}%` }}
      />
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
