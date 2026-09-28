import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseJitsukaDocument } from "./serialization";
import {
  restoreLocalDocument,
  STORAGE_KEY,
} from "../persistence/localJitsukaStorage";
import { blankDocument } from "./schema";
it("the published example is valid canonical v3 JSON", () => {
  const text = readFileSync("examples/butterfly-guard.v3.json", "utf8");
  expect(parseJitsukaDocument(text)).toEqual(JSON.parse(text));
});

it("starts with a fitted example only when no map is saved", () => {
  const storage = { getItem: () => null, setItem: () => {} };
  const result = restoreLocalDocument(storage);
  expect(result.error).toBeNull();
  expect(result.document.nodes).toHaveLength(7);
  expect(result.document.viewport).toBeUndefined();
});

it("preserves saved empty maps and reports corrupt saves without replacing them", () => {
  const blank = blankDocument();
  const storage = {
    getItem: (key: string) =>
      key === STORAGE_KEY ? JSON.stringify(blank) : null,
    setItem: () => {},
  };
  expect(restoreLocalDocument(storage).document).toEqual(blank);
  expect(
    restoreLocalDocument({ ...storage, getItem: () => "invalid" }).error,
  ).not.toBeNull();
});
