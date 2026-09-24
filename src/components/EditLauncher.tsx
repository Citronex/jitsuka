import { useEffect, useRef, useState } from "react";

const SIZE = 58;
const MARGIN = 16;

export function EditLauncher({
  onEdit,
  hidden,
}: {
  onEdit: () => void;
  hidden: boolean;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: MARGIN, y: MARGIN });
  const gesture = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  function clamp(x: number, y: number) {
    const bounds = button.current?.parentElement?.getBoundingClientRect();
    return {
      x: Math.max(
        MARGIN,
        Math.min(x, (bounds?.width ?? SIZE + MARGIN * 2) - SIZE - MARGIN),
      ),
      y: Math.max(
        MARGIN,
        Math.min(y, (bounds?.height ?? SIZE + MARGIN * 2) - SIZE - MARGIN),
      ),
    };
  }

  useEffect(() => {
    const parent = button.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() =>
      setPosition((p) => clamp(p.x, p.y)),
    );
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      hidden={hidden}
      ref={button}
      className="edit-launcher"
      style={{ left: position.x, top: position.y }}
      aria-label="Edit map"
      title="Edit map · drag to move"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        gesture.current = {
          x: event.clientX,
          y: event.clientY,
          left: position.x,
          top: position.y,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = gesture.current;
        if (!current) return;
        const dx = event.clientX - current.x,
          dy = event.clientY - current.y;
        if (Math.hypot(dx, dy) > 5) current.moved = true;
        if (current.moved)
          setPosition(clamp(current.left + dx, current.top + dy));
      }}
      onPointerUp={() => {
        suppressClick.current = gesture.current?.moved ?? false;
        gesture.current = null;
      }}
      onPointerCancel={() => {
        gesture.current = null;
        suppressClick.current = true;
      }}
      onLostPointerCapture={() => {
        gesture.current = null;
      }}
      onClick={(event) => {
        if (event.detail === 0 || !suppressClick.current) onEdit();
      }}
    >
      <span aria-hidden="true">柔</span>
    </button>
  );
}
