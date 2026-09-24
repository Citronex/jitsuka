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

The sample links to YouTube search results as placeholders. Replace these with instructional links. Maps save automatically in this browser's local storage. Clearing browser data removes the map; there is no cross-device sync yet.

## Structure

- `src/model.ts`: versioned domain schema, map operations, and initial sample.
- `src/storage.ts`: validated local persistence, isolated for a future persistence adapter.
- `src/App.tsx`: editor state, React Flow mapping, toolbar and inspector.
- `src/components/`: technique rendering and shared shape/color controls.

The original `reference/jitsuka-prototype-v2.html` remains unchanged as the UX reference.

## Verify

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests cover persisted maps, empty maps, invalid data, storage failures, safe URLs, and connected deletion. Browser tests cover creating and labeling connections, reloading, presentation links, deletion, and mobile editing.

## Phone installation and offline use

Open the deployed HTTPS site once online. On iPhone, use Safari → Share → Add to Home Screen. On Android, use Chrome's Install app / Add to Home screen menu. The application caches its assets for offline editing; video links require internet. App updates are offered under **My map → Update app**.

Maps remain local to each browser/device. Use **My map → Export map** on the original localhost app, send the JSON file to your phone, then **Import map** on the published app. Import validates the file and asks before replacing the local map. Export regularly for backup; browser data removal or app removal can erase local maps. Cloud sync is not implemented.

GitHub Pages publishes from `.github/workflows/deploy.yml` on pushes to `main`, at the `/jitsuka/` base path. Map files and user video URLs are not uploaded to GitHub by the application.

Verify production offline behavior: `npx playwright test --config playwright.offline.config.ts`.
