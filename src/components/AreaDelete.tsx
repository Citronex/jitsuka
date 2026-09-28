import { useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

type Point = { x: number; y: number };
export function AreaDelete({
  onDelete,
  onCancel,
}: {
  onDelete: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const flow = useReactFlow();
  const origin = useRef<Point | null>(null);
  const [box, setBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  return (
    <>
      <div
        className="area-delete-overlay"
        aria-label="Draw deletion area"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const bounds = event.currentTarget.getBoundingClientRect();
          origin.current = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          setBox(null);
          setIds([]);
        }}
        onPointerMove={(event) => {
          if (!origin.current || !event.isPrimary) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const end = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          setBox({
            x: Math.min(origin.current.x, end.x),
            y: Math.min(origin.current.y, end.y),
            width: Math.abs(end.x - origin.current.x),
            height: Math.abs(end.y - origin.current.y),
          });
        }}
        onPointerUp={(event) => {
          if (!origin.current || !event.isPrimary) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const from = flow.screenToFlowPosition({
            x: bounds.left + origin.current.x,
            y: bounds.top + origin.current.y,
          });
          const to = flow.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          const rect = {
            x: Math.min(from.x, to.x),
            y: Math.min(from.y, to.y),
            width: Math.abs(to.x - from.x),
            height: Math.abs(to.y - from.y),
          };
          setIds(
            rect.width > 2 && rect.height > 2
              ? flow.getIntersectingNodes(rect, false).map((node) => node.id)
              : [],
          );
          origin.current = null;
        }}
        onPointerCancel={() => {
          origin.current = null;
          setBox(null);
          setIds([]);
        }}
      >
        {box && (
          <div
            className="area-delete-box"
            style={{
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
            }}
          />
        )}
      </div>
      <div className="mode-tip area-delete-tip" role="status">
        <span>
          {ids.length
            ? `${ids.length} techniques selected. Connected lines will also be deleted.`
            : "Drag an area around the techniques to delete."}
        </span>
        <button disabled={!ids.length} onClick={() => onDelete(ids)}>
          Delete selected
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}
