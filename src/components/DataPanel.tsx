import { useEffect, useRef, useState } from "react";
import type { JitsukaDocument } from "../domain/schema";
import {
  serializeJitsukaDocument,
  tryRollDocument,
} from "../domain/serialization";

export function DataPanel({
  document,
  onRoll,
  onClear,
}: {
  document: JitsukaDocument;
  onRoll: (document: JitsukaDocument) => void;
  onClear: () => void;
}) {
  // Mounted when the panel opens: snapshot once, then preserve the user's draft.
  const [text, setText] = useState(() =>
    document.nodes.length || document.edges.length
      ? serializeJitsukaDocument(document)
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  function feedback(value: string, temporary = false) {
    clearTimeout(toastTimer.current);
    setMessage(value);
    if (temporary) toastTimer.current = setTimeout(() => setMessage(""), 4000);
  }
  async function roll() {
    setBusy(true);
    feedback("");
    // Yield through a paint so the indicator appears before parsing.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );
    const result = tryRollDocument(text, document);
    if (result.error) feedback(result.error);
    else {
      onRoll(result.document);
      setText(serializeJitsukaDocument(result.document));
      feedback("Map rolled.", true);
    }
    setBusy(false);
  }
  async function copyJson() {
    let json: string;
    try {
      json = serializeJitsukaDocument(document);
    } catch {
      feedback("Couldn't copy this map. Please check its data.");
      return;
    }
    setText(json);
    try {
      await navigator.clipboard.writeText(json);
      feedback("roll copied, oss 🤙🏽", true);
    } catch {
      feedback(
        "Clipboard unavailable. Your map is ready below; select and copy the JSON.",
      );
      requestAnimationFrame(() => {
        textarea.current?.focus();
        textarea.current?.select();
      });
    }
  }
  return (
    <section
      className="data-panel"
      aria-label="Portable map data"
      aria-busy={busy}
    >
      <label>
        Jitsuka JSON
        <textarea
          ref={textarea}
          rows={9}
          value={text}
          spellCheck={false}
          placeholder="Paste a Jitsuka map, then Roll"
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <div className="transfer-buttons roll-actions">
        <button className="primary" disabled={busy} onClick={() => void roll()}>
          {busy && (
            <span className="roll-spinner" aria-hidden="true">
              🤙🏽
            </span>
          )}{" "}
          Roll
        </button>
        <button disabled={busy} onClick={() => void copyJson()}>
          Copy JSON
        </button>
        <button className="clear-roll" disabled={busy} onClick={onClear}>
          Clear roll
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
