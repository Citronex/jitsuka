import { useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  ReactFlow,
  useReactFlow,
  type Connection as FlowConnection,
} from "@xyflow/react";
import { TechniqueNode } from "./components/TechniqueNode";
import {
  documentToFlow,
  type TechniqueFlowNode,
} from "./editor/documentToFlow";
import {
  type JitsukaDocument,
  type JitsukaNode,
  type JitsukaEdge,
} from "./domain/schema";
import {
  createAutosave,
  restoreLocalDocument,
  saveLocalJitsukaDocument,
} from "./persistence/localJitsukaStorage";
import { LinkEditor } from "./components/LinkEditor";
import { AppTools } from "./components/AppTools";
import { EditLauncher } from "./components/EditLauncher";
import { ColorChoices, ShapeChoices } from "./components/Choices";
import { safeUrl, type Connection, type Technique } from "./model";
const nodeTypes = { technique: TechniqueNode };
export function App() {
  const [initial] = useState(restoreLocalDocument);
  const [map, setMap] = useState(initial.document);
  const [measurements, setMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [saveError, setSaveError] = useState(initial.error);
  const [autosave] = useState(() =>
    createAutosave(saveLocalJitsukaDocument, setSaveError),
  );
  const [presentation, setPresentation] = useState(true);
  const [selected, setSelected] = useState<{
    type: "node" | "edge";
    id: string;
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [color, setColor] = useState<Technique["color"]>("blue");
  const [connector, setConnector] = useState<Connection["kind"] | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const edgeRef = useRef<HTMLTextAreaElement>(null);
  const dirty = useRef(false);
  const flow = useReactFlow<TechniqueFlowNode>();
  const node =
    selected?.type === "node"
      ? map.nodes.find((n) => n.id === selected.id)
      : undefined;
  const edge =
    selected?.type === "edge"
      ? map.edges.find((e) => e.id === selected.id)
      : undefined;
  function update(updater: (current: JitsukaDocument) => JitsukaDocument) {
    dirty.current = true;
    setMap(updater);
  }
  useEffect(() => {
    if (!dirty.current) return;
    autosave.schedule(map);
  }, [map, autosave]);
  useEffect(() => {
    const flush = () => autosave.flush();
    const hide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hide);
      autosave.flush();
    };
  }, [autosave]);
  useEffect(() => {
    if (selected?.type === "edge")
      edgeRef.current?.focus({ preventScroll: true });
  }, [selected]);
  function patchNode(patch: Partial<JitsukaNode>) {
    if (node)
      update((m) => ({
        ...m,
        nodes: m.nodes.map((n) => (n.id === node.id ? { ...n, ...patch } : n)),
      }));
  }
  function patchEdge(patch: Partial<JitsukaEdge>) {
    if (edge)
      update((m) => ({
        ...m,
        edges: m.edges.map((e) => (e.id === edge.id ? { ...e, ...patch } : e)),
      }));
  }
  function connect(connection: FlowConnection) {
    if (presentation || connection.source === connection.target) return;
    const existing = map.edges.find(
      (e) => e.source === connection.source && e.target === connection.target,
    );
    const id = existing?.id ?? crypto.randomUUID();
    if (!existing)
      update((m) => ({
        ...m,
        edges: [
          ...m.edges,
          {
            id,
            source: connection.source,
            target: connection.target,
            label: "",
            appearance: {
              arrow: connector === "line" ? "none" : "end",
              line: "solid",
              sourceAnchor:
                connection.sourceHandle === "top" ? "top" : "bottom",
              targetAnchor:
                connection.targetHandle === "bottom" ? "bottom" : "top",
            },
          },
        ],
      }));
    setSelected({ type: "edge", id });
    setStart(null);
    setConnector(null);
  }
  function chooseNode(id: string) {
    const technique = map.nodes.find((n) => n.id === id)!;
    if (presentation) {
      const url = safeUrl(technique.links?.[0]?.url);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } else if (connector) {
      if (start && start !== id)
        connect({
          source: start,
          target: id,
          sourceHandle: "bottom",
          targetHandle: "top",
        });
      else setStart(start === id ? null : id);
    } else {
      setAddOpen(false);
      setSelected({ type: "node", id });
    }
  }
  function finishTechnique() {
    setAddingId(null);
    setAddOpen(false);
    setSelected(null);
    titleRef.current?.blur();
  }
  function addTechnique(shape: Technique["shape"]) {
    const bounds = document.querySelector("main")!.getBoundingClientRect();
    const position = flow.screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
    const id = crypto.randomUUID();
    update((m) => ({
      ...m,
      nodes: [
        ...m.nodes,
        {
          id,
          type: "technique",
          label: "New technique",
          appearance: { shape, color },
          position,
        },
      ],
    }));
    setConnector(null);
    setStart(null);
    setSelected({ type: "node", id });
    setAddingId(id);
    requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
      titleRef.current?.select();
    });
  }
  function deleteSelected() {
    if (!selected) return;
    update((m) =>
      selected.type === "node"
        ? {
            ...m,
            nodes: m.nodes.filter((n) => n.id !== selected.id),
            edges: m.edges.filter(
              (e) => e.source !== selected.id && e.target !== selected.id,
            ),
          }
        : { ...m, edges: m.edges.filter((e) => e.id !== selected.id) },
    );
    setSelected(null);
  }
  const { nodes, edges } = documentToFlow(map, {
    presentation,
    selectedId: selected?.id,
    start,
    measurements,
  });
  return (
    <div
      className={`app ${presentation ? "presentation" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setSelected(null);
          setStart(null);
          setConnector(null);
        }
        if (
          !presentation &&
          (event.key === "Delete" || event.key === "Backspace") &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement) &&
          !(event.target instanceof HTMLSelectElement)
        ) {
          event.preventDefault();
          deleteSelected();
        }
      }}
    >
      <header>
        <div className="brand">
          <span className="brand-mark">j.</span>
          <div>
            jitsuka<small>BUILD YOUR GAME</small>
          </div>
        </div>
        <div className="header-center">
          {map.metadata.title} <span> / {presentation ? "View" : "Edit"}</span>
        </div>
        <div className="header-actions">
          <AppTools
            map={map}
            onImport={(imported) => {
              update(() => imported);
              autosave.schedule(imported);
              autosave.flush();
              setMeasurements({});
              setSelected(null);
              setStart(null);
              setConnector(null);
              requestAnimationFrame(() =>
                imported.viewport
                  ? flow.setViewport(imported.viewport)
                  : flow.fitView({ padding: 0.3 }),
              );
            }}
          />
          <span className="save-status">
            {saveError ? "Not saved" : "Saved on this device"}
          </span>
          <button
            onClick={() => flow.fitView({ padding: 0.25, duration: 250 })}
          >
            Fit map
          </button>
          {!presentation && (
            <button
              className="primary"
              onClick={() => {
                setPresentation(!presentation);
                setSelected(null);
                setConnector(null);
                setStart(null);
              }}
            >
              Done editing
            </button>
          )}
        </div>
      </header>
      <main>
        <EditLauncher
          hidden={!presentation}
          onEdit={() => {
            setPresentation(false);
            setAddOpen(false);
            setSelected(null);
          }}
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView={!initial.document.viewport}
          defaultViewport={initial.document.viewport}
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.15}
          maxZoom={2.5}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={!presentation && !connector}
          nodesConnectable={!presentation}
          edgesFocusable={!presentation}
          elementsSelectable={!presentation}
          deleteKeyCode={null}
          zoomOnPinch
          autoPanOnNodeDrag={false}
          onMoveEnd={(event, viewport) => {
            if (event) update((current) => ({ ...current, viewport }));
          }}
          onNodesChange={(changes) => {
            const dimensions = changes.filter(
              (change) => change.type === "dimensions",
            );
            if (dimensions.length)
              setMeasurements((current) => {
                let next = current;
                for (const change of dimensions) {
                  const size = change.dimensions;
                  if (
                    size &&
                    (current[change.id]?.width !== size.width ||
                      current[change.id]?.height !== size.height)
                  ) {
                    if (next === current) next = { ...current };
                    next[change.id] = size;
                  }
                }
                return next;
              });
            const positions = changes.filter((c) => c.type === "position");
            if (positions.length)
              update((m) => ({
                ...m,
                nodes: m.nodes.map((n) => {
                  const change = positions.find((c) => c.id === n.id);
                  return change?.position
                    ? { ...n, position: change.position }
                    : n;
                }),
              }));
          }}
          onConnect={connect}
          isValidConnection={(c) => c.source !== c.target}
          onNodeClick={(_, n) => chooseNode(n.id)}
          onNodeDoubleClick={(_, n) => {
            if (!presentation && !connector) {
              setSelected({ type: "node", id: n.id });
              requestAnimationFrame(() => titleRef.current?.focus());
            }
          }}
          onEdgeClick={(_, e) => {
            if (!presentation) {
              setSelected({ type: "edge", id: e.id });
              setConnector(null);
              setStart(null);
            }
          }}
          onPaneClick={() => {
            if (!presentation) {
              setSelected(null);
              setAddOpen(true);
            }
          }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={28}
            color="#e4e7dd"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
        <div className="editor-dock">
          {!presentation && (
            <aside className="toolbar panel">
              {!addOpen || node || edge ? (
                <button
                  className="expand-tools"
                  aria-expanded={false}
                  onClick={() => {
                    setSelected(null);
                    setAddOpen(true);
                  }}
                >
                  Add a technique <span aria-hidden="true">＋</span>
                </button>
              ) : (
                <>
                  <div className="eyebrow">YOUR NEXT MOVE</div>
                  <div className="inspector-heading">
                    <h2>Add a technique</h2>
                    <button
                      aria-label="Minimize add technique"
                      onClick={() => setAddOpen(false)}
                    >
                      −
                    </button>
                  </div>
                  <ShapeChoices onChange={addTechnique} />
                  <p className="field-caption">Choose a color</p>
                  <ColorChoices value={color} onChange={setColor} />
                  <hr />
                  <h2>Connect your game</h2>
                  <div className="connector-buttons">
                    {(["line", "arrow"] as const).map((kind) => (
                      <button
                        key={kind}
                        aria-pressed={connector === kind}
                        onClick={() => {
                          setConnector(connector === kind ? null : kind);
                          setStart(null);
                          setSelected(null);
                        }}
                      >
                        {kind === "line" ? "— Line" : "→ Arrow"}
                      </button>
                    ))}
                  </div>
                  <p className="hint">
                    Choose a connector, then tap two techniques. Or drag between
                    their connection points.
                  </p>
                  <div className="toolbar-footer">
                    Positions. Reactions. Possibilities.
                  </div>
                </>
              )}
            </aside>
          )}
          {!presentation && !node && !edge && (
            <aside
              className="panel collapsed-editor"
              aria-label="Edit a technique collapsed"
            >
              <div
                className="expand-tools"
                title="Select a technique on the map to edit it"
              >
                Edit a technique <span aria-hidden="true">＋</span>
              </div>
            </aside>
          )}
          {!presentation && (node || edge) && (
            <aside
              className="inspector panel"
              aria-label={
                node
                  ? addingId === node.id
                    ? "Add technique"
                    : "Edit technique"
                  : "Edit connection"
              }
            >
              <div className="inspector-heading">
                <h2>
                  {node
                    ? addingId === node.id
                      ? "Add technique"
                      : "Edit technique"
                    : "Edit connection"}
                </h2>
                <button
                  aria-label="Close editor"
                  onClick={() => {
                    setSelected(null);
                    setAddOpen(false);
                  }}
                >
                  ×
                </button>
              </div>
              {node && (
                <>
                  <label>
                    Technique / position
                    <input
                      ref={titleRef}
                      value={node.label}
                      maxLength={80}
                      onChange={(e) => patchNode({ label: e.target.value })}
                    />
                  </label>
                  <label>
                    Type
                    <select
                      aria-label="Node type"
                      value={node.type}
                      onChange={(event) =>
                        patchNode({
                          type: event.target.value as JitsukaNode["type"],
                        })
                      }
                    >
                      <option value="position">Position</option>
                      <option value="technique">Technique</option>
                      <option value="reaction">Reaction</option>
                      <option value="goal">Goal</option>
                    </select>
                  </label>
                  <LinkEditor
                    key={node.id}
                    links={node.links ?? []}
                    onChange={(links) => patchNode({ links })}
                  />
                  <p className="field-caption">Shape</p>
                  <ShapeChoices
                    value={node.appearance?.shape}
                    onChange={(shape) =>
                      patchNode({ appearance: { ...node.appearance, shape } })
                    }
                  />
                  <p className="field-caption">Color</p>
                  <ColorChoices
                    value={node.appearance?.color as Technique["color"]}
                    onChange={(color) =>
                      patchNode({ appearance: { ...node.appearance, color } })
                    }
                  />
                </>
              )}
              {edge && (
                <>
                  <label>
                    Action / condition
                    <textarea
                      rows={3}
                      ref={edgeRef}
                      value={edge.label ?? ""}
                      maxLength={120}
                      placeholder="e.g. Opponent posts hand"
                      onChange={(e) => patchEdge({ label: e.target.value })}
                    />
                  </label>
                  <label>
                    Connector
                    <select
                      value={
                        edge.appearance?.arrow === "end" ? "arrow" : "line"
                      }
                      onChange={(e) =>
                        patchEdge({
                          appearance: {
                            ...edge.appearance,
                            arrow: e.target.value === "line" ? "none" : "end",
                          },
                        })
                      }
                    >
                      <option value="arrow">Directional arrow →</option>
                      <option value="line">Line —</option>
                    </select>
                  </label>
                  <p className="hint">
                    What makes the next move available? Add a grip, reaction,
                    opening, or decision.
                  </p>
                </>
              )}
              <hr />
              <div className="inspector-actions">
                {node && (
                  <button className="primary" onClick={finishTechnique}>
                    {addingId === node.id
                      ? "Add technique"
                      : "Update technique"}
                  </button>
                )}
                <button className="danger" onClick={deleteSelected}>
                  Delete {node ? "technique" : "connection"}
                </button>
              </div>
            </aside>
          )}
        </div>
        {connector && (
          <div className="mode-tip" role="status">
            {start ? "Tap the next technique" : "Tap the first technique"}
            <button
              onClick={() => {
                setConnector(null);
                setStart(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {!map.nodes.length && (
          <div className="empty">
            <h2>Your game starts here.</h2>
            <p>
              {presentation
                ? "Switch to Edit to add techniques."
                : "Choose a shape to add your first technique."}
            </p>
          </div>
        )}
        <div className="map-caption">
          {map.nodes.length} techniques <span>·</span> {map.edges.length}{" "}
          connections
        </div>
        {saveError && (
          <div className="notice" role="status">
            {saveError}
          </div>
        )}
      </main>
    </div>
  );
}
