import { gameMapSchema, sampleMap, type GameMap } from "./model";
export const STORAGE_KEY = "jitsuka.map.v1";
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export function loadMap(storage: StoragePort): {
  map: GameMap;
  error: string | null;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return {
      map:
        raw === null
          ? structuredClone(sampleMap)
          : gameMapSchema.parse(JSON.parse(raw)),
      error: null,
    };
  } catch {
    return {
      map: structuredClone(sampleMap),
      error:
        "Your saved map could not be loaded. A sample is shown; the saved copy has not been overwritten.",
    };
  }
}
export function saveMap(storage: StoragePort, map: GameMap): string | null {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(map));
    return null;
  } catch {
    return "Could not save on this device. Keep this tab open to retain your changes.";
  }
}
