import { reactive, computed, watchEffect } from "vue";
import {
  Direction,
  gridSpacing,
  nodeRadius,
  spacingOffsets,
  nodeTextWidth,
  nodeTextHeight,
  directionOffsets,
  nodeCommentWidth,
  nodeCommentHeight,
} from "./constants";
import { boxBox, boxLine } from "intersects";

interface NodeContentsStart {
  type: "START";
}

interface NodeContentsHalt {
  type: "HALT";
}

interface NodeContentsRegister {
  type: "REG";
  op: "+" | "-";
  index: number;
}

interface NodeContentsComment {
  type: "CMT";
  comment: string;
  new?: true;
}

interface NodeBase {
  id: number;
  x: number;
  y: number;
}

export type Node = NodeBase &
  (
    | NodeContentsStart
    | NodeContentsHalt
    | NodeContentsRegister
    | NodeContentsComment
  );

export interface Connector {
  id: number;
  n1: number;
  d1: Direction;
  n2: number;
  d2: Direction;
  alt?: boolean;
}

export interface RenderableConnector extends Connector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type RegisterContents = { [index: number]: number | undefined };

export interface Store {
  name: string;

  selected: Set<number>;
  movingNode?: number;
  movingNodeStartX?: number;
  movingNodeStartY?: number;

  connectorStartNode?: number;
  connectorStartDirection?: Direction;

  nextId: number;
  nodes: { [id: number]: Node };
  connectors: { [id: number]: Connector };

  shiftKey: boolean;
  ctrlKey: boolean;
  mouseX: number;
  mouseY: number;
  viewportX: number;
  viewportY: number;

  downMouseX?: number;
  downMouseY?: number;
  downViewportX?: number;
  downViewportY?: number;

  selectionStartX?: number;
  selectionStartY?: number;

  playing: boolean;
  playSpeed: number;
  activeNode?: number;
  activeConnector?: number;
}

export const defaultViewportCoords = (): [x: number, y: number] => [
  (window.innerWidth - 300) / 2,
  window.innerHeight / 2,
];

const initialDefaultViewportCoords = defaultViewportCoords();
export const store = reactive<Store>({
  name: "",

  selected: new Set<number>(),
  nextId: 0,
  nodes: {},
  connectors: {},

  shiftKey: false,
  ctrlKey: false,
  mouseX: -1,
  mouseY: -1,
  viewportX: initialDefaultViewportCoords[0],
  viewportY: initialDefaultViewportCoords[1],

  playing: false,
  playSpeed: 4,
});

watchEffect(() => {
  const name = store.name;
  document.title = `RMs${name ? `: ${name}` : ""}`;
});

export const maxRegisterIndex = computed(() => {
  return Object.values(store.nodes).reduce(
    (maxIndex, node) =>
      node.type === "REG" ? Math.max(maxIndex, node.index) : maxIndex,
    -1
  );
});

export const renderableNodesConnectors = computed(() => {
  const { nodes, connectors } = store;
  const renderableNodes = Object.values(nodes).map((node) => ({
    ...node,
    x: node.x * gridSpacing,
    y: node.y * gridSpacing,
  }));

  const nodeConnectors = storeNodeConnectors.value.nodeConnectors;
  const renderableConnectors = Object.values(
    connectors
  ).map<RenderableConnector>((connector) => {
    const n1 = nodes[connector.n1];
    const n2 = nodes[connector.n2];

    const n1Connectors = nodeConnectors[connector.n1][connector.d1];
    const n2Connectors = nodeConnectors[connector.n2][connector.d2];

    const n1Count = n1Connectors.count;
    const n2Count = n2Connectors.count;
    const n1Index = n1Connectors.indices[connector.id];
    const n2Index = n2Connectors.indices[connector.id];

    const n1Offset = -(n1Count - 1) / 2 + n1Index;
    const n2Offset = -(n2Count - 1) / 2 + n2Index;

    return {
      ...connector,
      x1: n1.x * gridSpacing + n1Offset * spacingOffsets[connector.d1].x,
      y1: n1.y * gridSpacing + n1Offset * spacingOffsets[connector.d1].y,
      x2: n2.x * gridSpacing + n2Offset * spacingOffsets[connector.d2].x,
      y2: n2.y * gridSpacing + n2Offset * spacingOffsets[connector.d2].y,
    };
  });

  return { nodes: renderableNodes, connectors: renderableConnectors };
});

function buildMouseGridCoords(subgridFactor: number): [x: number, y: number] {
  return [
    Math.round(
      ((store.mouseX - store.viewportX) / gridSpacing) * subgridFactor
    ) / subgridFactor,
    Math.round(
      ((store.mouseY - store.viewportY) / gridSpacing) * subgridFactor
    ) / subgridFactor,
  ];
}
export const mouseGridCoords = computed(() => buildMouseGridCoords(1));
export const mouseSubgridCoords = computed(() => buildMouseGridCoords(5));
export const movingNodeGridCoords = computed(() => {
  return store.movingNode && store.nodes[store.movingNode].type === "CMT"
    ? mouseSubgridCoords.value
    : mouseGridCoords.value;
});

export const selectionBoundingBox = computed(() => {
  if (
    store.selectionStartX === undefined ||
    store.selectionStartY === undefined
  ) {
    return undefined;
  }
  const x1 = store.selectionStartX;
  const y1 = store.selectionStartY;
  const x2 = store.mouseX;
  const y2 = store.mouseY;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
});

export const nodeBoundingBoxes = computed(() => {
  const nodes = renderableNodesConnectors.value.nodes;
  const nodeSize = 2 * nodeRadius;
  return nodes.map((node) => {
    let width = nodeSize,
      height = nodeSize;
    if (node.type === "CMT") {
      width = nodeCommentWidth(node.comment);
      height = nodeCommentHeight;
    } else if (node.type !== "REG") {
      width = nodeTextWidth;
      height = nodeTextHeight;
    }
    return {
      id: node.id,
      x: node.x - width / 2,
      y: node.y - height / 2,
      width,
      height,
    };
  });
});

export const selectedIds = computed(() => {
  const selected: number[] = [];
  const boundingBox = selectionBoundingBox.value;
  if (boundingBox === undefined) return selected;
  const { width, height } = boundingBox;
  const x = boundingBox.x - store.viewportX;
  const y = boundingBox.y - store.viewportY;
  const nodes = nodeBoundingBoxes.value;
  const connectors = renderableNodesConnectors.value.connectors;

  for (const node of nodes) {
    boxBox(x, y, width, height, node.x, node.y, node.width, node.height) &&
      selected.push(node.id);
  }

  for (const connector of connectors) {
    const o1 = directionOffsets[connector.d1];
    const o2 = directionOffsets[connector.d2];
    const x1 = connector.x1 + o1.x;
    const y1 = connector.y1 + o1.y;
    const x2 = connector.x2 + o2.x;
    const y2 = connector.y2 + o2.y;
    boxLine(x, y, width, height, x1, y1, x2, y2) && selected.push(connector.id);
  }

  return selected;
});

export const storeNodeConnectors = computed(() => {
  const { nodes, connectors } = store;

  const nodeConnectors: {
    [nodeId: number]: {
      [direction: number]: {
        count: number;
        indices: { [connectorId: number]: number };
      };
    };
  } = {};

  const nodeConnectedNodes: {
    [nodeId: number]: {
      primary?: { via: number; nodeId: number };
      alt?: { via: number; nodeId: number };
    };
  } = {};
  const connectorErrors = new Set<number>();

  const addNodeConnector = (
    connectorId: number,
    nodeId: number,
    otherNodeId: number,
    direction: number,
    otherDirection: number,
    second: boolean
  ) => {
    const node = nodeConnectors[nodeId] || (nodeConnectors[nodeId] = {});
    const nodeDirection =
      node[direction] || (node[direction] = { count: 0, indices: {} });
    nodeDirection.indices[connectorId] = nodeDirection.count;
    if (nodeId !== otherNodeId || direction !== otherDirection || second) {
      nodeDirection.count++;
    }
  };

  const addNodeConnectedNode = (
    connectorId: number,
    nodeId: number,
    otherNodeId: number,
    alt?: boolean
  ) => {
    const nodeConnected =
      nodeConnectedNodes[nodeId] || (nodeConnectedNodes[nodeId] = {});
    if (alt) {
      const node = nodes[nodeId];
      if (
        node.type === "REG" &&
        node.op === "-" &&
        nodeConnected.alt === undefined
      ) {
        nodeConnected.alt = { via: connectorId, nodeId: otherNodeId };
      } else {
        connectorErrors.add(connectorId);
      }
    } else {
      if (nodeConnected.primary === undefined) {
        nodeConnected.primary = { via: connectorId, nodeId: otherNodeId };
      } else {
        connectorErrors.add(connectorId);
      }
    }
  };

  for (const { id, n1, d1, n2, d2, alt } of Object.values(connectors)) {
    addNodeConnector(id, n1, n2, d1, d2, false);
    addNodeConnector(id, n2, n1, d2, d1, true);
    addNodeConnectedNode(id, n1, n2, alt);
  }

  return { nodeConnectors, nodeConnectedNodes, connectorErrors };
});

export const active = computed(() => store.activeNode !== undefined);
