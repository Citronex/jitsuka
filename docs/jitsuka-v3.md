# Jitsuka v3 map format

Import [the current Butterfly Guard example](../examples/butterfly-guard.v3.json) using **My map → Feed your roll**, or paste its JSON and press **Roll**.

The following is a TypeScript reference, not literal JSON. `?` means optional. Use quoted property names and actual values in JSON files.

```typescript
{
  format: "jitsuka";
  schemaVersion: 3;
  metadata: { title: string; description?: string };
  nodes: {
    id: string;
    type: "guard" | "position" | "pass" | "sweep" | "submission" | "escape" | "takedown";
    label: string;
    description?: string;
    position: { x: number; y: number };
    links?: { type: "video" | "article" | "other"; url: string; label?: string }[];
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
    appearance?: {
      line?: "solid" | "dashed";
      arrow?: "none" | "end";
      sourceAnchor?: "top" | "bottom";
      targetAnchor?: "top" | "bottom";
    };
  }[];
  viewport?: { x: number; y: number; zoom: number };
}
```

- IDs must be nonempty and unique within nodes or edges. Edge source/target must refer to existing node IDs.
- Coordinates must be finite numbers; zoom must be positive. Omit viewport to fit the map automatically.
- Links must be complete HTTP(S) URLs.
- Category determines shape, fill, text, and border. Do not include node appearance fields.
- Edge labels describe the condition, reaction, or action enabling the next node. Put instructions in node descriptions.
- Solid arrows represent intended transitions; dashed arrows represent alternatives.

The runtime validator is `src/domain/schema.ts`. The app also accepts older documents and migrates them to v3.
