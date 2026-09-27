import { useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import type { JitsukaDocument } from "../domain/schema";
import {
  parseJitsukaDocument,
  serializeJitsukaDocument,
} from "../domain/serialization";
import { DataPanel } from "./DataPanel";

export function AppTools({
  map,
  onImport,
  onClear,
}: {
  map: JitsukaDocument;
  onImport: (map: JitsukaDocument) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [importRevision, setImportRevision] = useState(0);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<JitsukaDocument | null>(null);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  function exportMap() {
    const url = URL.createObjectURL(
      new Blob([serializeJitsukaDocument(map)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "jitsuka-map.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details
      className="app-tools"
      ref={details}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary ref={summary}>My map</summary>
      <div className="app-tools-panel panel">
        <div className="inspector-heading">
          <h2>Take your game with you</h2>
          <button
            aria-label="Close My map"
            onClick={() => {
              if (details.current) details.current.open = false;
              summary.current?.focus();
            }}
          >
            ×
          </button>
        </div>
        <p>Version {import.meta.env.VITE_APP_VERSION}</p>
        {open && (
          <DataPanel key={importRevision} document={map} onRoll={onImport} />
        )}
        <p>
          Your map saves automatically. Roll applies the JSON to your map. Copy
          JSON copies your current map for sharing. Take your roll downloads a
          file; Feed your roll loads one.
        </p>
        <div className="transfer-buttons">
          <button onClick={exportMap}>Take your roll</button>
          <button onClick={() => input.current?.click()}>Feed your roll</button>
        </div>
        <button
          className="clear-roll"
          onClick={() => {
            if (
              !window.confirm(
                "are you sure? these will delete your roll data from the map (not your device)",
              )
            )
              return;
            onClear();
            setPending(null);
            setImportRevision((value) => value + 1);
            setMessage(
              "Canvas cleared. Reload to restore your saved roll. Editing or loading another roll will replace the saved roll.",
            );
          }}
        >
          Clear roll
        </button>
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
              setPending(parseJitsukaDocument(await file.text()));
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
                setImportRevision((value) => value + 1);
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
