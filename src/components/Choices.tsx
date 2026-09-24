import { colors, shapes, type Technique } from "../model";
export function ShapeChoices({
  value,
  onChange,
}: {
  value?: Technique["shape"];
  onChange: (shape: Technique["shape"]) => void;
}) {
  return (
    <div className="choices">
      {shapes.map((shape) => (
        <button
          key={shape}
          title={shape}
          aria-label={`${shape} shape`}
          aria-pressed={value === shape}
          onClick={() => onChange(shape)}
        >
          <span className={`shape-icon ${shape}`} />
        </button>
      ))}
    </div>
  );
}
export function ColorChoices({
  value,
  onChange,
}: {
  value: Technique["color"];
  onChange: (color: Technique["color"]) => void;
}) {
  return (
    <div className="choices">
      {colors.map((color) => (
        <button
          key={color}
          aria-label={`${color} color`}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
        >
          <span className={`swatch ${color}`} />
        </button>
      ))}
    </div>
  );
}
