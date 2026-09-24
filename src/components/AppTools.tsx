import { useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { gameMapSchema, type GameMap } from "../model";

export function AppTools({
  map,
  onImport,
}: {
  map: GameMap;
  onImport: (map: GameMap) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<GameMap | null>(null);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  function exportMap() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(map, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "jitsuka-map.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="app-tools">
      <summary>My map</summary>
      <div className="app-tools-panel panel">
        <h2>Take your game with you</h2>
        <p>Version {import.meta.env.VITE_APP_VERSION}</p>
        <p>
          Maps are saved on this device. Export your map, send the file to your
          phone, then import it there.
        </p>
        <div className="transfer-buttons">
          <button onClick={exportMap}>Export map</button>
          <button onClick={() => input.current?.click()}>Import map</button>
        </div>
        <input
          hidden
          ref={input}
          type="file"
          accept=".json,application/json"
          aria-label="Import map file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              if (file.size > 5_000_000) throw new Error("Too large");
              setPending(gameMapSchema.parse(JSON.parse(await file.text())));
              setMessage("");
            } catch {
              setPending(null);
              setMessage(
                "That file is not a valid Jitsuka map. Your current map is unchanged.",
              );
            }
          }}
        />
        {pending && (
          <div>
            <p>
              Replace this device’s map with {pending.nodes.length} techniques?
              Export your current map first if you want to keep it.
            </p>
            <button
              onClick={() => {
                onImport(pending);
                setPending(null);
                setMessage("Map imported.");
              }}
            >
              Replace map
            </button>{" "}
            <button onClick={() => setPending(null)}>Cancel</button>
          </div>
        )}
        {message && <p role="status">{message}</p>}
        <hr />
        <h2>Install on your phone</h2>
        <p>
          iPhone: open in Safari, tap Share, then Add to Home Screen. Android:
          open in Chrome, then choose Install app or Add to Home screen from its
          menu.
        </p>
        <p>
          {offlineReady
            ? "Ready to open and edit offline. Video links still need internet."
            : "Open once online to prepare offline access. Video links need internet."}
        </p>
        {needRefresh && (
          <button onClick={() => void updateServiceWorker(true)}>
            Update app
          </button>
        )}
      </div>
    </details>
  );
}
