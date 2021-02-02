<!--suppress HtmlFormInputWithoutLabel -->
<template>
  <svg
    ref="board"
    id="board"
    class="canvas"
    @mousemove="onMouseMove"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    :class="{ ['hover-enabled']: hoverEnabled }"
  >
    <defs>
      <ConnectorDefs />
    </defs>

    <g class="templates" v-if="!store.playing">
      <Node
        v-for="([x, tmpl], i) in nodeTemplates"
        :key="i"
        :id="-2"
        :x="x"
        :y="40"
        :template="tmpl"
      >
        <NodeContentsRegister v-if="tmpl.type === 'REG'">
          <template v-slot:sup>{{ tmpl.op === "+" ? "+" : "–" }}</template>
          <template v-slot:sub>{{ tmpl.index }}</template>
        </NodeContentsRegister>
        <NodeContentsComment
          v-else-if="tmpl.type === 'CMT'"
          :text="tmpl.comment"
        />
        <NodeContentsText v-else :text="tmpl.type" />
      </Node>
    </g>

    <g :transform="`translate(${store.viewportX}, ${store.viewportY})`">
      <circle
        v-if="store.ctrlKey"
        class="paste-marker"
        :r="nodeConnectionPointRadius"
        :cx="mouseGridCoords[0] * gridSpacing"
        :cy="mouseGridCoords[1] * gridSpacing"
      />

      <Connector
        v-for="connector in renderableNodesConnectors.connectors"
        :key="connector.id"
        :id="connector.id"
        :x1="connector.x1"
        :y1="connector.y1"
        :d1="connector.d1"
        :x2="connector.x2"
        :y2="connector.y2"
        :d2="connector.d2"
        :alt="connector.alt"
      />

      <Node
        v-for="node in renderableNodesConnectors.nodes"
        :key="node.id"
        :id="node.id"
        :x="node.x"
        :y="node.y"
        :directions="
          node.type === 'REG'
            ? nodeRegisterDirections
            : node.type === 'CMT'
            ? []
            : nodeTextDirections
        "
      >
        <NodeContentsRegister v-if="node.type === 'REG'">
          <template v-slot:sup>{{ node.op === "+" ? "+" : "–" }}</template>
          <template v-slot:sub>{{ node.index }}</template>
        </NodeContentsRegister>
        <NodeContentsComment
          v-else-if="node.type === 'CMT'"
          :text="node.comment"
        />
        <NodeContentsText v-else :text="node.type" />
      </Node>

      <Connector
        v-if="creatingConnector"
        :id="creatingConnector.id"
        :x1="creatingConnector.x1"
        :y1="creatingConnector.y1"
        :d1="creatingConnector.d1"
        :x2="creatingConnector.x2"
        :y2="creatingConnector.y2"
        :d2="creatingConnector.d2"
        :alt="creatingConnector.alt"
        creating
      />
    </g>

    <rect
      v-if="selectionBoundingBox"
      :x="selectionBoundingBox.x"
      :y="selectionBoundingBox.y"
      :width="selectionBoundingBox.width"
      :height="selectionBoundingBox.height"
      stroke="rgb(0,148,255)"
      fill="rgba(0,148,255,0.25)"
    />
  </svg>

  <div id="details">
    <h1>
      RMs<span>
        by
        <a
          href="https://github.com/mrbbot"
          target="_blank"
          rel="noopener noreferrer"
          >@mrbbot</a
        ></span
      >
    </h1>
    <p>
      <a
        href="https://github.com/mrbbot/rms/blob/master/README.md"
        target="_blank"
        rel="noopener noreferrer"
        >Help</a
      >
      |
      <a
        href="https://github.com/mrbbot/rms"
        target="_blank"
        rel="noopener noreferrer"
        >GitHub</a
      >
    </p>
    <hr />
    <div class="row">
      <input class="grow" type="text" placeholder="Name" v-model="store.name" />
      <button :disabled="active" @click="save">Save</button>
      <button :disabled="active" @click="onOpenClick">Open</button>
    </div>
    <hr />
    <div class="row">
      <button :disabled="!active" @click="reset">Reset</button>
      <button :disabled="store.playing" @click="step">Step</button>
      <button @click="playPause">{{ store.playing ? "Pause" : "Play" }}</button>
      <input
        class="grow"
        type="range"
        title="Speed"
        min="0"
        max="9"
        step="1"
        v-model.number="store.playSpeed"
      />
    </div>
    <hr />
    <div class="row">
      <svg class="canvas" width="40" :height="30 * registers.length">
        <g
          v-for="register in registers"
          :key="register.index"
          :transform="register.transform"
          :class="{ active: activeRegister === register.index }"
        >
          <NodeContentsRegister>
            <template v-slot:sub>{{ register.index }}</template>
          </NodeContentsRegister>
        </g>
      </svg>
      <div class="grow column">
        <input
          v-for="register in registers"
          :key="register.index"
          type="number"
          placeholder="0"
          :disabled="store.playing"
          v-model.number="registerContents[register.index]"
        />
      </div>
    </div>
  </div>

  <input ref="file" type="file" style="display: none" @change="onFileChange" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ConnectorComponent from "./components/Connector.vue";
import ConnectorDefs from "./components/ConnectorDefs.vue";
import {
  mouseGridCoords,
  store,
  selectionBoundingBox,
  renderableNodesConnectors,
  RenderableConnector,
  selectedIds,
  movingNodeGridCoords,
  maxRegisterIndex,
  active,
} from "./components/store";
import { registerContents, reset, step, playPause } from "./components/machine";
import { save, open, copyData, pasteData } from "./components/data";
import {
  Direction,
  gridSpacing,
  nodeRegisterDirections,
  nodeTextDirections,
  nodeConnectionPointRadius,
} from "./components/constants";
import NodeContentsText from "./components/NodeContentsText.vue";
import NodeContentsRegister from "./components/NodeContentsRegister.vue";
import NodeComponent from "./components/Node.vue";
import NodeContentsComment from "./components/NodeContentsComment.vue";

export default defineComponent({
  name: "Board",
  components: {
    NodeContentsComment,
    Node: NodeComponent,
    NodeContentsRegister,
    NodeContentsText,
    ConnectorDefs,
    Connector: ConnectorComponent,
  },
  setup() {
    return {
      store,
      Direction,
      nodeTextDirections,
      nodeRegisterDirections,
      gridSpacing,
      nodeTemplates: [
        [40, { type: "REG", op: "+", index: 0 }],
        [100, { type: "REG", op: "-", index: 0 }],
        [190, { type: "START" }],
        [310, { type: "HALT" }],
        [424, { type: "CMT", comment: "COMMENT" }],
      ],
      selectionBoundingBox,
      renderableNodesConnectors,
      nodeConnectionPointRadius,
      mouseGridCoords,
      maxRegisterIndex,
      registerContents,
      active,
      save,
      reset,
      step,
      playPause,
    };
  },
  computed: {
    hoverEnabled() {
      return store.movingNode === undefined && !store.playing;
    },
    creatingConnector(): RenderableConnector | undefined {
      if (
        store.connectorStartNode === undefined ||
        store.connectorStartDirection === undefined
      )
        return undefined;
      const startNode = store.nodes[store.connectorStartNode];
      return {
        id: -2,
        n1: -1,
        d1: store.connectorStartDirection,
        n2: -1,
        d2: Direction.NONE,
        alt: store.shiftKey,
        x1: startNode.x * gridSpacing,
        y1: startNode.y * gridSpacing,
        x2: store.mouseX - store.viewportX,
        y2: store.mouseY - store.viewportY,
      };
    },
    registers() {
      return Array.from(Array(maxRegisterIndex.value + 1)).map((_, i) => ({
        index: i,
        transform: `translate(15,${i * 30 + 15})`,
      }));
    },
    activeRegister() {
      if (store.activeNode === undefined) return undefined;
      const node = store.nodes[store.activeNode];
      return node.type === "REG" ? node.index : undefined;
    },
  },
  mounted() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  },
  methods: {
    onMouseMove(e: MouseEvent) {
      // console.log("Board: onMouseMove");
      store.mouseX = e.clientX;
      store.mouseY = e.clientY;
      if (
        store.downMouseX !== undefined &&
        store.downMouseY !== undefined &&
        store.downViewportX !== undefined &&
        store.downViewportY !== undefined
      ) {
        store.viewportX = store.downViewportX + e.clientX - store.downMouseX;
        store.viewportY = store.downViewportY + e.clientY - store.downMouseY;
      } else if (store.movingNode !== undefined) {
        const [newX, newY] = movingNodeGridCoords.value;
        store.nodes[store.movingNode].x = newX;
        store.nodes[store.movingNode].y = newY;
      }
    },
    onMouseDown(e: MouseEvent) {
      // console.log("Board: onMouseDown");
      if (e.buttons === 1 && !store.playing) {
        store.selectionStartX = e.clientX;
        store.selectionStartY = e.clientY;
      } else if (e.buttons === 4) {
        store.downMouseX = e.clientX;
        store.downMouseY = e.clientY;
        store.downViewportX = store.viewportX;
        store.downViewportY = store.viewportY;
      }
    },
    onMouseUp(e: MouseEvent) {
      // console.log("Board: onMouseUp");

      store.downMouseX = undefined;
      store.downMouseY = undefined;
      store.downViewportX = undefined;
      store.downViewportY = undefined;
      store.selected.clear();

      if (store.playing) return;

      if (
        store.selectionStartX !== undefined &&
        store.selectionStartY !== undefined
      ) {
        selectedIds.value.forEach((id) => store.selected.add(id));
      }
      store.selectionStartX = undefined;
      store.selectionStartY = undefined;

      const clickedId = parseInt((e.target as SVGElement)?.dataset?.id || "");
      if (!isNaN(clickedId)) store.selected.add(clickedId);
      // store.selected = isNaN(clickedId) ? undefined : clickedId;
      if (store.connectorStartNode !== undefined) {
        // If we didn't click up on another connector, reset
        store.connectorStartNode = undefined;
        store.connectorStartDirection = undefined;
      }
      if (store.movingNode !== undefined) {
        // Make sure we're not on top of another node
        const [newX, newY] = movingNodeGridCoords.value;
        const intersects = Object.values(store.nodes).some(
          (node) =>
            node.x === newX && node.y === newY && node.id !== store.movingNode
        );
        if (intersects) {
          // If we drop on top of another node, reset its position
          if (
            store.movingNodeStartX === undefined ||
            store.movingNodeStartY === undefined
          ) {
            // If there's no position to reset to (from template), delete the node
            console.log("Board: onMouseUp: reset: delete:", store.movingNode);
            delete store.nodes[store.movingNode];
            // No need to delete connectors since this must've come from a template
          } else {
            console.log("Board: onMouseUp: reset:", store.movingNode);
            store.nodes[store.movingNode].x = store.movingNodeStartX;
            store.nodes[store.movingNode].y = store.movingNodeStartY;
          }
        }
        store.selected.clear();
        store.selected.add(store.movingNode);
        // store.selected = store.movingNode;
        store.movingNode = undefined;
        store.movingNodeStartX = undefined;
        store.movingNodeStartY = undefined;
      }
    },
    async onKeyDown(e: KeyboardEvent) {
      // console.log("Board: onKeyDown:", e.key);
      const ctrlKey = e.ctrlKey || e.metaKey;
      store.shiftKey = e.shiftKey;
      store.ctrlKey = ctrlKey;
      if (ctrlKey && e.key === "c") {
        e.preventDefault();
        const permission = await navigator.permissions.query({
          name: "clipboard-write" as any,
        });
        if (permission.state === "granted" || permission.state === "prompt") {
          const data = copyData();
          console.log("copy", data);
          await navigator.clipboard.writeText(data);
          console.log("Written to clipboard!");
        }
      } else if (ctrlKey && e.key === "v") {
        e.preventDefault();
        const permission = await navigator.permissions.query({
          name: "clipboard-read" as any,
        });
        if (permission.state === "granted" || permission.state === "prompt") {
          const text = await navigator.clipboard.readText();
          console.log("paste", text);
          pasteData(text);
        }
      } else if (store.selected.size && e.key === "Delete") {
        e.preventDefault();
        // console.log(
        //   "Board: onKeyDown: deleting:",
        //   Array.from(store.selected.values())
        // );
        for (const selected of store.selected) {
          delete store.nodes[selected];
        }
        store.connectors = Object.fromEntries(
          Object.entries(store.connectors).filter(
            ([, connector]) =>
              !store.selected.has(connector.id) &&
              !store.selected.has(connector.n1) &&
              !store.selected.has(connector.n2)
          )
        );
        store.selected.clear();
      } else if (store.selected.size === 1) {
        e.preventDefault();
        const node = store.nodes[store.selected.values().next().value];
        if (node === undefined) return;
        if (node.type === "REG") {
          let index = node.index.toString();
          if (!isNaN(parseInt(e.key))) {
            index += e.key;
          } else if (e.key === "Backspace") {
            index = index.substring(0, index.length - 1) || "0";
          }
          const newIndex = parseInt(index);
          if (newIndex <= 99) node.index = newIndex;
        } else if (node.type === "CMT") {
          if (e.key.length === 1) {
            node.comment += e.key;
          } else if (e.key === "Backspace") {
            node.comment = node.comment.substring(0, node.comment.length - 1);
          }
        }
      }
    },
    onKeyUp(e: KeyboardEvent) {
      // console.log("Board: onKeyUp:", e.key);
      store.shiftKey = e.shiftKey;
      store.ctrlKey = e.ctrlKey || e.metaKey;
    },
    onOpenClick() {
      (this.$refs.file as HTMLInputElement).click();
    },
    onFileChange(e: Event) {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      const reader = new FileReader();
      const file = target.files[0];
      reader.addEventListener("load", () => {
        open(reader.result as string, file.name);
        target.value = "";
      });
      reader.readAsText(file);
    },
  },
});
</script>

<style lang="scss">
.background,
.connection-point {
  fill: transparent;
}

svg.canvas {
  font-family: "Noto Serif", serif;
  font-size: 1.5rem;
  user-select: none;
  .text {
    font-family: "Courier Prime", monospace;
    font-size: 1.75rem;
    &.comment {
      font-size: 1.25rem;
    }
  }
  .script {
    font-size: 1.1875rem;
  }
}

#board {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% - 300px);
  height: 100%;
  background-color: white;

  .node {
    &.active {
      color: #4caf50;
    }
    &.selected {
      color: #0094ff;
    }
  }

  .connector {
    &.error {
      color: #f44336;
    }
    &.active {
      color: #4caf50;
    }
    &.creating,
    &.selected {
      color: #0094ff;
    }
    &.creating {
      pointer-events: none;
    }
  }

  .paste-marker {
    fill: rgba(0, 0, 0, 0.05);
  }
  &.hover-enabled .node:hover {
    .background {
      fill: rgba(0, 0, 0, 0.05);
    }
    .connection-point {
      fill: rgba(0, 0, 0, 0.1);
      &:hover {
        fill: rgba(#0094ff, 0.5);
      }
    }
  }
}

#details {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  overflow-y: auto;
  padding: 0.5rem;

  h1 {
    font-family: "Noto Serif", serif;
    font-weight: normal;
    font-size: 1.75rem;
    margin: 0;
    span {
      font-size: 1rem;
      color: #666666;
    }
  }

  p {
    margin-top: 0.5rem;
    margin-bottom: 0;
    font-family: "Noto Serif", serif;
  }

  a {
    color: inherit;
  }

  input {
    height: 24px;
  }

  .row {
    display: flex;
    .grow {
      flex: 1;
      min-width: 0;
    }
    > *:not(:last-child) {
      margin-right: 0.5rem;
    }
  }

  .column {
    display: flex;
    flex-direction: column;
    > input {
      width: 100%;
      margin: 3px 0;
    }
  }

  pre {
    margin: 0;
  }

  .canvas .active {
    color: #4caf50;
  }
}
</style>
