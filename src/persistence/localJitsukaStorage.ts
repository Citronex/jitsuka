import { blankDocument, type JitsukaDocument } from "../domain/schema";
import starterMap from "../../examples/butterfly-guard.v3.json";
import {
  parseJitsukaDocument,
  serializeJitsukaDocument,
} from "../domain/serialization";
export const STORAGE_KEY = "jitsuka:document:v3";
export const V2_STORAGE_KEY = "jitsuka:document:v2";
export const V1_STORAGE_KEY = "jitsuka:document:v1";
export const LEGACY_STORAGE_KEY = "jitsuka.map.v1";
export type StoragePort = Pick<Storage, "getItem" | "setItem">;

export function saveLocalJitsukaDocument(
  document: JitsukaDocument,
  storage: StoragePort = window.localStorage,
): void {
  storage.setItem(STORAGE_KEY, serializeJitsukaDocument(document));
}
export function loadLocalJitsukaDocument(
  storage: StoragePort = window.localStorage,
): JitsukaDocument | null {
  const raw =
    storage.getItem(STORAGE_KEY) ??
    storage.getItem(V2_STORAGE_KEY) ??
    storage.getItem(V1_STORAGE_KEY) ??
    storage.getItem(LEGACY_STORAGE_KEY);
  return raw === null ? null : parseJitsukaDocument(raw);
}
export function restoreLocalDocument(
  storage: StoragePort = window.localStorage,
) {
  try {
    const saved = loadLocalJitsukaDocument(storage);
    const document = saved ?? parseJitsukaDocument(JSON.stringify(starterMap));
    // Fit the starter to this device rather than reuse the example's desktop viewport.
    if (!saved) delete document.viewport;
    return {
      document,
      error: null,
    };
  } catch {
    return {
      document: blankDocument(),
      error:
        "Your saved map could not be loaded. Its stored copy has not been overwritten.",
    };
  }
}

export function createAutosave(
  save: (document: JitsukaDocument) => void,
  onError: (error: string | null) => void,
  delay = 350,
) {
  let pending: JitsukaDocument | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function flush() {
    clearTimeout(timer);
    if (!pending) return;
    try {
      save(pending);
      pending = null;
      onError(null);
    } catch {
      onError(
        "Could not save on this device. Use Copy JSON to copy your map before closing this tab.",
      );
    }
  }
  return {
    schedule(document: JitsukaDocument) {
      pending = document;
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
    cancel() {
      clearTimeout(timer);
      pending = null;
    },
  };
}
