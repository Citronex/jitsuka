import { expect, it } from "vitest";
import { NODE_STYLE_BY_TYPE } from "./nodeShapes";
import { halfGuardFixture } from "../domain/fixture";
import { parseJitsukaDocument } from "../domain/serialization";
import {
  loadLocalJitsukaDocument,
  saveLocalJitsukaDocument,
  STORAGE_KEY,
  V2_STORAGE_KEY,
} from "../persistence/localJitsukaStorage";

// WCAG relative luminance for the explicit six-digit sRGB palette.
function luminance(hex: string) {
  const channels = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
it.each(Object.entries(NODE_STYLE_BY_TYPE))(
  "%s text has at least 4.5:1 contrast",
  (_, style) => {
    const values = [
      luminance(style.textColor),
      luminance(style.backgroundColor),
    ].sort((a, b) => b - a);
    expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
    expect(style.borderColor).toMatch(/^#[0-9A-F]{6}$/);
  },
);
it("keeps position neutral slate with dark text", () => {
  expect(NODE_STYLE_BY_TYPE.position).toMatchObject({
    backgroundColor: "#E5E9EE",
    textColor: "#253027",
    shape: "rounded",
  });
});
it("migrates v2 colors away without changing category or meaningful data", () => {
  const old = {
    ...halfGuardFixture,
    schemaVersion: 2,
    nodes: halfGuardFixture.nodes.map((node) => ({
      ...node,
      appearance: { color: "#abcdef" },
    })),
  };
  expect(parseJitsukaDocument(JSON.stringify(old))).toEqual(halfGuardFixture);
  const raw = JSON.stringify(old);
  const values = new Map([[V2_STORAGE_KEY, raw]]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const migrated = loadLocalJitsukaDocument(storage)!;
  saveLocalJitsukaDocument(migrated, storage);
  expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(halfGuardFixture);
  expect(values.get(V2_STORAGE_KEY)).toBe(raw);
});
