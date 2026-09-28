import { expect, test } from "@playwright/test";
import { nodeTypes } from "../src/domain/schema";
import { NODE_STYLE_BY_TYPE } from "../src/editor/nodeShapes";

const rgb = (hex: string) =>
  `rgb(${hex
    .slice(1)
    .match(/../g)!
    .map((part) => parseInt(part, 16))
    .join(", ")})`;

test("categories drive shapes through edits, reload and portable JSON", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => {} },
      configurable: true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Edit map" }).click();
  await page
    .getByRole("button", { name: "Add a technique", exact: true })
    .click();
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Add technique", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Category", { exact: true }).locator("option:checked"),
  ).toHaveText("Select your BJJ concept");
  await page.getByLabel("Category", { exact: true }).selectOption("sweep");
  await page
    .getByRole("button", { name: "Add technique", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("John Wayne Sweep");
  await expect(page.locator(".technique.hexagon")).toHaveCount(1);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Connect the arm; drive with the hips.");
  await page
    .getByLabel("Video or reference link")
    .fill("https://www.youtube.com/watch?v=example");
  await page.getByLabel("Category", { exact: true }).selectOption("submission");
  await expect(page.locator(".technique.diamond")).toHaveCount(1);
  await expect(page.locator(".technique-title-linked")).toHaveCSS(
    "color",
    rgb(NODE_STYLE_BY_TYPE.submission.textColor),
  );
  await expect(page.locator(".technique.diamond .technique-shape")).toHaveCSS(
    "fill",
    rgb(NODE_STYLE_BY_TYPE.submission.backgroundColor),
  );
  await expect(page.getByRole("button", { name: /shape/i })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /blue|green|amber|purple/i }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add technique", exact: true })
    .click();
  await page.reload();
  await expect(
    page.locator('.technique.diamond[data-category="submission"]'),
  ).toHaveCount(1);
  await page.getByText("My map", { exact: true }).click();
  await page.getByRole("button", { name: "Copy JSON", exact: true }).click();
  const json = await page.getByLabel("Jitsuka JSON").inputValue();
  const doc = JSON.parse(json);
  expect(doc.schemaVersion).toBe(3);
  expect(doc.nodes[0].type).toBe("submission");
  expect(doc.nodes[0]).not.toHaveProperty("appearance");
  expect(doc.nodes[0].description).toContain("drive with the hips");
  expect(doc.nodes[0].links).toHaveLength(1);
  expect(json).not.toContain('"shape"');
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear roll" }).click();
  await page.getByLabel("Jitsuka JSON").fill(json);
  await page.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(page.locator(".technique.diamond")).toHaveCount(1);
  await page.getByRole("button", { name: "Close My map" }).click();
  await page.getByRole("button", { name: "Edit map" }).click();
  await page.locator(".react-flow__node").click();
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue(
    "submission",
  );
});

test("all categories render distinct shapes with visible labels and connections", async ({
  page,
}) => {
  await page.addInitScript(
    (types) =>
      localStorage.setItem(
        "jitsuka:document:v3",
        JSON.stringify({
          format: "jitsuka",
          schemaVersion: 3,
          metadata: { title: "BJJ categories" },
          nodes: types.map((type, i) => ({
            id: type,
            type,
            label: type[0].toUpperCase() + type.slice(1),
            position: { x: (i % 4) * 280, y: Math.floor(i / 4) * 260 },
            appearance: { color: "green" },
          })),
          edges: types.slice(1).map((type, i) => ({
            id: `edge-${i}`,
            source: types[i],
            target: type,
            label: "opponent posts",
            appearance: { arrow: "end", line: i % 2 ? "dashed" : "solid" },
          })),
        }),
      ),
    nodeTypes,
  );
  await page.goto("/");
  for (const type of nodeTypes) {
    const style = NODE_STYLE_BY_TYPE[type];
    const node = page.locator(`.technique.${style.shape}`);
    await expect(node).toBeVisible();
    await expect(node.locator(".technique-title")).toHaveCSS(
      "color",
      rgb(style.textColor),
    );
    await expect(node.locator(".technique-shape")).toHaveCSS(
      "fill",
      rgb(style.backgroundColor),
    );
    await expect(node.locator(".technique-shape > :first-child")).toHaveCSS(
      "stroke",
      rgb(style.borderColor),
    );
  }
  await expect(page.locator(".react-flow__edge-path")).toHaveCount(6);
  await page.screenshot({ path: "test-results/categories.png" });
});
