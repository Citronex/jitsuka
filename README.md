# Jitsuka

A local-first Brazilian Jiu-Jitsu game-plan editor built with React, TypeScript, Vite, and React Flow. No backend or accounts.

## Run

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

Open the address printed by Vite. `npm run build` type-checks and creates the production bundle; `npm run preview` serves it.

## Use

- Maps open in View mode. Drag the floating 柔 button to reposition it; click or tap it to enter Edit mode. Choose Done editing to return to View.
- Choose a Category, then Add technique. Its name is immediately ready to edit.
- Select a node to edit its name, category, description, or links. Category automatically determines shape, fill, text, and border colors. Linked techniques open their reference in a new tab only in View mode. Drag it to move it; connection mode connects nodes without opening links.
- Choose Normal (solid arrow) or Fallback (dashed arrow), then tap the source and target. The transition field receives focus immediately. Dragging between node handles also creates connections.
- An edge's **Transition condition** explains when/why the next node becomes available: “opponent posts,” “same-side arm connection,” or “sweep succeeds.” Put how-to instructions in the node's **Description**.
- Use the inspector or Delete/Backspace to delete selected items. Escape cancels selection and connection mode.
- Pan the background, scroll or use controls to zoom, and pinch on touch screens.
- View mode hides editing controls; tapping a technique opens its HTTP(S) reference in a new tab.

New devices start with the Butterfly Guard example, fitted to the screen. Existing saved maps, including intentionally empty maps, take precedence. Maps save automatically in this browser's local storage, debounced by 350 ms and flushed when the page is hidden or closed. Clearing browser data removes the map; there is no cross-device sync.

Opening **My map** shows the current map's JSON. Paste or edit a Jitsuka JSON document and press **Roll** to apply it to the map. Invalid data leaves the current map untouched. **Copy JSON** copies the current map to your clipboard; if copying is unavailable, the JSON is selected for manual copying. **Take your roll** downloads a JSON file; **Feed your roll** loads one. Reopening the panel refreshes the JSON from the current map.

## Structure

- `src/domain/`: canonical Zod schema, parsing, serialization, legacy migration, and a portable Half Guard fixture.
- `src/persistence/localJitsukaStorage.ts`: validated local persistence and debounced autosave, using `jitsuka:document:v3`.
- `src/editor/nodeShapes.ts`: the centralized semantic style mapping and handle geometry.
- `src/editor/documentToFlow.tsx`: explicit projection into React Flow. Editor measurements and selections never enter the saved document.
- `src/model.ts`: legacy format reader, old example map, and shared shape/color/URL helpers.
- `src/App.tsx`: canonical document state, interaction handlers, toolbar and inspector.
- `src/components/`: technique rendering and shared category controls.

The original `reference/jitsuka-prototype-v2.html` remains unchanged as the UX reference.

## Verify

```sh
npm test
npx playwright install chromium webkit
npm run test:e2e
npm run build
```

Unit tests cover schema validation, full document round trips, legacy migration, corrupt storage, and debounced saves. Browser tests cover Roll/Save, mocked clipboard success/failure, reloading, editing, connections, and mobile dragging in Chromium and WebKit.

The public format is `{ format: "jitsuka", schemaVersion: 3, metadata, nodes, edges, viewport? }`. Node categories are guard, position, pass, sweep, submission, escape, and takedown. Nodes preserve descriptions, positions, and multiple HTTP(S) links. Node appearance is derived from category and is not stored. The semantic palette uses explicit text colors with at least 4.5:1 contrast; the pastel fills use dark text, and position stays neutral slate/gray.

| Category   | Derived shape     |
| ---------- | ----------------- |
| Guard      | Pill              |
| Position   | Rounded rectangle |
| Pass       | Parallelogram     |
| Sweep      | Hexagon           |
| Submission | Diamond           |
| Escape     | Octagon           |
| Takedown   | Double rectangle  |

Version-1 documents and pre-document maps migrate on load/import. Old positions remain positions. Familiar technique names are inferred conservatively (for example, John Wayne Sweep → sweep, Armbar → submission). Ambiguous techniques, reactions, and goals become positions with a migration note appended to the description; no nodes or edges are deleted. Explicit old shapes are discarded after validation. Edge labels, URLs, and legacy undirected lines are preserved; new connections use solid or dashed arrows. Unknown versions and invalid categories are rejected.

Version-2 documents migrate to version 3 by discarding redundant node appearance while preserving content and connections.

Storage checks `jitsuka:document:v3`, then `jitsuka:document:v2`, then `jitsuka:document:v1`, then `jitsuka.map.v1`. The next edit writes v3 and retains old keys as backups. A corrupt current record is reported, never silently replaced with a stale backup. `src/domain/fixture.ts` contains current-schema sample maps; the old sample in `src/model.ts` is retained only to test migrations.

## Phone installation and offline use

Open the deployed HTTPS site once online. On iPhone, use Safari → Share → Add to Home Screen. On Android, use Chrome's Install app / Add to Home screen menu. The application caches its assets for offline editing; video links require internet. App updates are offered under **My map → Update app**.

Maps remain local to each browser/device. Use **My map → Take your roll** on the original localhost app, send the JSON file to your phone, then **Feed your roll** on the published app. Import validates the file and asks before replacing the local map. Export regularly for backup; browser data removal or app removal can erase local maps. Cloud sync is not implemented.

GitHub Pages publishes from `.github/workflows/deploy.yml` on pushes to `main`, at the `/jitsuka/` base path. Map files and user video URLs are not uploaded to GitHub by the application.

Verify production offline behavior: `npx playwright test --config playwright.offline.config.ts`.

## Map examples and format

See the [v3 field reference](docs/jitsuka-v3.md) and [Butterfly Guard example](examples/butterfly-guard.v3.json).

In Edit mode, choose **Delete an area**, drag a rectangle around complete nodes, then **Delete selected**. Nodes partially outside the rectangle are kept. Connections attached to deleted nodes are removed too. Cancel or Escape exits without deleting. Deletions save automatically.
