import { nodeTypes, type JitsukaNodeType } from "../domain/schema";
export function CategoryChoice({
  value,
  onChange,
}: {
  value: JitsukaNodeType | "";
  onChange: (category: JitsukaNodeType) => void;
}) {
  return (
    <label>
      Category
      <select
        aria-label="Category"
        value={value}
        onChange={(event) => onChange(event.target.value as JitsukaNodeType)}
      >
        {value === "" && (
          <option value="" disabled>
            Select your BJJ concept
          </option>
        )}
        {nodeTypes.map((type) => (
          <option key={type} value={type}>
            {type[0].toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}
