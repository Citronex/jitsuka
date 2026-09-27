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
- Choose one of four shapes to add a technique. Its title is immediately ready to edit.
- Select a node to edit its title, video URL, shape, or color. Linked techniques open their reference in a new tab only in View mode. Drag it to move it; connection mode connects nodes without opening links.
- Choose Line or Arrow, then tap the source and target. The connection label receives focus immediately. Dragging between node handles also creates connections.
- Select a connection to edit its action/condition or change its direction indicator.
- Use the inspector or Delete/Backspace to delete selected items. Escape cancels selection and connection mode.
- Pan the background, scroll or use controls to zoom, and pinch on touch screens.
- View mode hides editing controls; tapping a technique opens its HTTP(S) reference in a new tab.

New devices start with a blank canvas. Maps save automatically in this browser's local storage, debounced by 350 ms and flushed when the page is hidden or closed. Clearing browser data removes the map; there is no cross-device sync.

Opening **My map** shows the current map's JSON. Paste or edit a Jitsuka JSON document and press **Roll** to apply it to the map. Invalid data leaves the current map untouched. **Copy JSON** copies the current map to your clipboard; if copying is unavailable, the JSON is selected for manual copying. **Take your roll** downloads a JSON file; **Feed your roll** loads one. Reopening the panel refreshes the JSON from the current map.

## Structure

- `src/domain/`: canonical Zod schema, parsing, serialization, legacy migration, and a portable Half Guard fixture.
- `src/persistence/localJitsukaStorage.ts`: validated local persistence and debounced autosave, using `jitsuka:document:v1`.
- `src/editor/documentToFlow.tsx`: explicit projection into React Flow. Editor measurements and selections never enter the saved document.
- `src/model.ts`: legacy format reader, old example map, and shared shape/color/URL helpers.
- `src/App.tsx`: canonical document state, interaction handlers, toolbar and inspector.
- `src/components/`: technique rendering and shared shape/color controls.

The original `reference/jitsuka-prototype-v2.html` remains unchanged as the UX reference.

## Verify

```sh
npm test
npx playwright install chromium webkit
npm run test:e2e
npm run build
```

Unit tests cover schema validation, full document round trips, legacy migration, corrupt storage, and debounced saves. Browser tests cover Roll/Save, mocked clipboard success/failure, reloading, editing, connections, and mobile dragging in Chromium and WebKit.

The public format is `{ format: "jitsuka", schemaVersion: 1, metadata, nodes, edges, viewport? }`. Node types are position, technique, reaction, or goal; nodes preserve descriptions, positions, shape/color, and multiple HTTP(S) links. Edges preserve action labels, solid/dashed lines, arrows, and optional top/bottom attachment anchors. Supported shapes are rounded, pill, diamond, and circle; colors are blue, green, amber, purple, or six-digit hex. Unknown schema versions are rejected. Legacy `jitsuka.map.v1` data is read if the new key is absent and written in the new format on the next edit; the legacy copy is retained. Corrupt stored data is left untouched on startup.

## Phone installation and offline use

Open the deployed HTTPS site once online. On iPhone, use Safari → Share → Add to Home Screen. On Android, use Chrome's Install app / Add to Home screen menu. The application caches its assets for offline editing; video links require internet. App updates are offered under **My map → Update app**.

Maps remain local to each browser/device. Use **My map → Take your roll** on the original localhost app, send the JSON file to your phone, then **Feed your roll** on the published app. Import validates the file and asks before replacing the local map. Export regularly for backup; browser data removal or app removal can erase local maps. Cloud sync is not implemented.

GitHub Pages publishes from `.github/workflows/deploy.yml` on pushes to `main`, at the `/jitsuka/` base path. Map files and user video URLs are not uploaded to GitHub by the application.

Verify production offline behavior: `npx playwright test --config playwright.offline.config.ts`.
