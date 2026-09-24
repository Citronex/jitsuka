import { useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type Connection as FlowConnection,
} from "@xyflow/react";
import {
  TechniqueNode,
  type TechniqueFlowNode,
} from "./components/TechniqueNode";
import { AppTools } from "./components/AppTools";
import { EditLauncher } from "./components/EditLauncher";
import { ColorChoices, ShapeChoices } from "./components/Choices";
import {
  removeTechnique,
  safeUrl,
  type Connection,
  type GameMap,
  type Technique,
} from "./model";
import { loadMap, saveMap } from "./storage";
const nodeTypes = { technique: TechniqueNode };
function readInitialMap() {
  try {
    return loadMap(window.localStorage);
  } catch {
    return loadMap({
      getItem: () => {
        throw new Error("Storage unavailable");
      },
      setItem: () => {},
    });
  }
}
export function App() {
  const [initial] = useState(readInitialMap);
  const [map, setMap] = useState(initial.map);
  const [measurements, setMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [saveError, setSaveError] = useState(initial.error);
  const [presentation, setPresentation] = useState(true);
  const [selected, setSelected] = useState<{
    type: "node" | "edge";
    id: string;
  } | null>(null);
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
  function update(updater: (current: GameMap) => GameMap) {
    dirty.current = true;
    setMap(updater);
  }
  useEffect(() => {
    if (!dirty.current) return;
    try {
      setSaveError(saveMap(window.localStorage, map));
    } catch {
      setSaveError(
        "Local storage is unavailable. Changes remain in this tab only.",
      );
    }
  }, [map]);
  useEffect(() => {
    if (selected?.type === "edge")
      edgeRef.current?.focus({ preventScroll: true });
  }, [selected]);
  function patchNode(patch: Partial<Technique>) {
    if (node)
      update((m) => ({
        ...m,
        nodes: m.nodes.map((n) => (n.id === node.id ? { ...n, ...patch } : n)),
      }));
  }
  function patchEdge(patch: Partial<Connection>) {
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
          { ...connection, id, kind: connector ?? "arrow", label: "" },
        ],
      }));
    setSelected({ type: "edge", id });
    setStart(null);
    setConnector(null);
  }
  function chooseNode(id: string) {
    const technique = map.nodes.find((n) => n.id === id)!;
    if (presentation) {
      const url = safeUrl(technique.url);
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
      setSelected({ type: "node", id });
    }
  }
  function finishTechnique() {
    setAddingId(null);
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
        { id, title: "New technique", shape, color, position },
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
        ? removeTechnique(m, selected.id)
        : { ...m, edges: m.edges.filter((e) => e.id !== selected.id) },
    );
    setSelected(null);
  }
  const nodes: TechniqueFlowNode[] = map.nodes.map((n) => ({
    id: n.id,
    type: "technique",
    position: n.position,
    measured: measurements[n.id],
    data: { ...n, presentation, connecting: start === n.id },
    selected: !presentation && selected?.id === n.id,
    ariaLabel: n.title,
  }));
  const edges = map.edges.map((e) => ({
    ...e,
    type: "default",
    sourceHandle: e.sourceHandle ?? "bottom",
    targetHandle: e.targetHandle ?? "top",
    selected: !presentation && selected?.id === e.id,
    markerEnd:
      e.kind === "arrow"
        ? { type: MarkerType.ArrowClosed, color: "#62685f" }
        : undefined,
    label: e.label
      ? e.label.split("\n").map((line, index) => (
          <tspan key={index} x={0} y={12 + index * 18}>
            {line || "\u00a0"}
          </tspan>
        ))
      : undefined,
    interactionWidth: 28,
    style: { strokeWidth: 2, stroke: "#62685f" },
    labelStyle: { fontSize: 12, fontWeight: 600, fill: "#444b40" },
    labelBgStyle: { fill: "#f7f8f3" },
    labelBgPadding: [10, 7] as [number, number],
    labelBgBorderRadius: 6,
  }));
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
          My game plan <span> / {presentation ? "View" : "Edit"}</span>
        </div>
        <div className="header-actions">
          <AppTools
            map={map}
            onImport={(imported) => {
              update(() => imported);
              setSelected(null);
              setStart(null);
              setConnector(null);
              requestAnimationFrame(() => flow.fitView({ padding: 0.3 }));
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
          onEdit={() => setPresentation(false)}
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
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
          onPaneClick={() => setSelected(null)}
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
              {node || edge ? (
                <button
                  className="expand-tools"
                  aria-expanded={false}
                  onClick={() => setSelected(null)}
                >
                  Add a technique <span aria-hidden="true">＋</span>
                </button>
              ) : (
                <>
                  <div className="eyebrow">YOUR NEXT MOVE</div>
                  <h2>Add a technique</h2>
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
                  onClick={() => setSelected(null)}
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
                      value={node.title}
                      maxLength={80}
                      onChange={(e) => patchNode({ title: e.target.value })}
                    />
                  </label>
                  <label>
                    Video or reference link
                    <input
                      type="url"
                      placeholder="add video link"
                      value={node.url ?? ""}
                      onChange={(e) => patchNode({ url: e.target.value })}
                      aria-invalid={!!node.url && !safeUrl(node.url)}
                    />
                  </label>
                  {node.url && !safeUrl(node.url) && (
                    <p className="error">Use a complete http or https URL.</p>
                  )}
                  <p className="field-caption">Shape</p>
                  <ShapeChoices
                    value={node.shape}
                    onChange={(shape) => patchNode({ shape })}
                  />
                  <p className="field-caption">Color</p>
                  <ColorChoices
                    value={node.color}
                    onChange={(color) => patchNode({ color })}
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
                      value={edge.kind}
                      onChange={(e) =>
                        patchEdge({
                          kind: e.target.value === "line" ? "line" : "arrow",
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
        {presentation && (
          <div className="study-tip">
            VIEW MODE <span>Tap a linked technique to open its video ↗</span>
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
