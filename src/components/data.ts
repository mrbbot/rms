import {
  Connector,
  defaultViewportCoords,
  mouseGridCoords,
  Node,
  RegisterContents,
  store,
} from "./store";
import { loadRegisterContents, registerContents } from "./machine";
import { gridSpacing } from "./constants";

const $download = document.getElementById("download") as HTMLAnchorElement;

interface SavedData {
  $rm: any;
  name: string;
  nodes: Node[];
  connectors: Connector[];
  registers: RegisterContents;
  // TODO: next id from max id
}

export function save() {
  const { name, nodes, connectors } = store;
  const registers = Object.fromEntries(Object.entries(registerContents));
  const data: SavedData = {
    $rm: true,
    name,
    nodes: Object.values(nodes),
    connectors: Object.values(connectors),
    registers,
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  $download.href = url;
  $download.download = `${name || "Machine"}.json`;
  $download.click();
  URL.revokeObjectURL(url);
}

export function open(text: string, fileName: string) {
  let data: SavedData;
  try {
    data = JSON.parse(text);
    if (data.$rm !== true) return;
  } catch (e) {
    return;
  }

  // Reset everything
  store.selected.clear();
  store.movingNode = undefined;
  store.movingNodeStartX = undefined;
  store.movingNodeStartY = undefined;
  store.connectorStartNode = undefined;
  store.connectorStartDirection = undefined;
  store.nodes = {};
  store.connectors = {};

  // Used for getting nextId
  let maxId = -1;
  // Used for centering viewport on machine
  let nodeXTotal = 0;
  let nodeYTotal = 0;

  // Load data
  store.name = data.name || fileName.substring(0, fileName.lastIndexOf("."));
  for (const node of data.nodes) {
    store.nodes[node.id] = node;
    nodeXTotal += node.x;
    nodeYTotal += node.y;
    maxId = Math.max(maxId, node.id);
  }
  for (const connector of data.connectors) {
    store.connectors[connector.id] = connector;
    maxId = Math.max(maxId, connector.id);
  }
  loadRegisterContents(data.registers);

  store.nextId = maxId + 1;

  // Center viewport on machine
  const averageNodeX = nodeXTotal / data.nodes.length;
  const averageNodeY = nodeYTotal / data.nodes.length;
  const defaultViewport = defaultViewportCoords();
  store.viewportX = defaultViewport[0] - averageNodeX * gridSpacing;
  store.viewportY = defaultViewport[1] - averageNodeY * gridSpacing;
}

interface ClipboardData {
  $rm: any;
  nodes: Node[];
  connectors: Connector[];
}

export function copyData(): string {
  const { selected, nodes, connectors } = store;
  let nextId = 0,
    minX = Infinity,
    minY = Infinity;
  const nodesCopy: Node[] = [];
  const connectorsCopy: Connector[] = [];
  const nodeIdRemap: { [id: number]: number } = {};

  for (const id of selected) {
    if (id in nodes) {
      const node = nodes[id];
      const newId = nextId++;
      nodeIdRemap[id] = newId;
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      nodesCopy.push({ ...node, id: newId });
    } else if (id in connectors) {
      const connector = connectors[id];
      if (selected.has(connector.n1) && selected.has(connector.n2)) {
        connectorsCopy.push({ ...connector, id: nextId++ });
      }
    }
  }
  minX = Math.floor(minX);
  minY = Math.floor(minY);
  for (const nodeCopy of nodesCopy) {
    nodeCopy.x -= minX;
    nodeCopy.y -= minY;
  }
  for (const connectorCopy of connectorsCopy) {
    connectorCopy.n1 = nodeIdRemap[connectorCopy.n1];
    connectorCopy.n2 = nodeIdRemap[connectorCopy.n2];
  }

  const data: ClipboardData = {
    $rm: true,
    nodes: nodesCopy,
    connectors: connectorsCopy,
  };
  return JSON.stringify(data);
}

export function pasteData(text: string) {
  let data: ClipboardData;
  try {
    data = JSON.parse(text);
    if (data.$rm !== true) return;
  } catch (e) {
    return;
  }

  let nextId = store.nextId;
  const nodeIdRemap: { [id: number]: number } = {};
  const [x, y] = mouseGridCoords.value;

  for (const node of data.nodes) {
    const newId = nextId++;
    nodeIdRemap[node.id] = newId;
    node.id = newId;
    node.x += x;
    node.y += y;
    store.nodes[newId] = node;
  }
  for (const connector of data.connectors) {
    connector.id = nextId++;
    connector.n1 = nodeIdRemap[connector.n1];
    connector.n2 = nodeIdRemap[connector.n2];
    store.connectors[connector.id] = connector;
  }

  store.nextId = nextId;
}
