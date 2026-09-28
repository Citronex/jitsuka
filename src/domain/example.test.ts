import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseJitsukaDocument } from "./serialization";
it("the published example is valid canonical v3 JSON", () => {
  const text = readFileSync("examples/butterfly-guard.v3.json", "utf8");
  expect(parseJitsukaDocument(text)).toEqual(JSON.parse(text));
});
