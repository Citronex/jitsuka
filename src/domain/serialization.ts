import { jitsukaDocumentSchema, type JitsukaDocument } from "./schema";
import { migrateDocument } from "./migrations";

export function parseJitsukaDocument(input: string): JitsukaDocument {
  return jitsukaDocumentSchema.parse(migrateDocument(JSON.parse(input)));
}
export function serializeJitsukaDocument(document: JitsukaDocument): string {
  return JSON.stringify(jitsukaDocumentSchema.parse(document), null, 2);
}
export function tryRollDocument(input: string, current: JitsukaDocument) {
  try {
    return { document: parseJitsukaDocument(input), error: null };
  } catch {
    return {
      document: current,
      error:
        "Couldn't roll this map. The pasted data isn't a valid Jitsuka map or uses an unsupported version.",
    };
  }
}
