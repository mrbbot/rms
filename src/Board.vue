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
        :light="tmpl.type === 'CMT'"
      >
        <NodeContentsRegister
          v-if="tmpl.type === 'REG'"
          :op="tmpl.op === '+' ? '+' : '–'"
          :index="tmpl.index"
        />
        <NodeContentsComment
          v-else-if="tmpl.type === 'CMT'"
          :text="tmpl.comment"
        />
        <NodeContentsDummy v-else-if="tmpl.type === 'DUM'" />
        <NodeContentsText v-else :text="tmpl.type" />
      </Node>
    </g>

    <a
      v-if="store.nextId === 0"
      href="https://github.com/mrbbot/rms/blob/master/README.md"
      target="_blank"
      rel="noopener noreferrer"
    >
      <text
        class="get-started"
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        Click here to get started
      </text>
    </a>

    <circle
      v-if="store.ctrlKey"
      class="paste-marker"
      :r="nodeConnectionPointRadius"
      :cx="mouseGridCoords[0] * gridSpacing + store.viewportX"
      :cy="mouseGridCoords[1] * gridSpacing + store.viewportY"
    />

    <g
      ref="viewport"
      :transform="`translate(${store.viewportX}, ${store.viewportY})`"
    >
      <Connector
        v-for="connector in renderableNodesConnectors.connectors"
        :key="connector.id"
        :id="connector.id"
        :x1="connector.x1"
        :y1="connector.y1"
        :d1="connector.d1"
        :dummy1="connector.dummy1"
        :x2="connector.x2"
        :y2="connector.y2"
        :d2="connector.d2"
        :dummy2="connector.dummy2"
        :alt="connector.alt"
      />

      <Node
        v-for="node in renderableNodesConnectors.nodes"
        :key="node.id"
        :id="node.id"
        :x="node.x"
        :y="node.y"
        :directions="
          node.type === 'REG' || node.type === 'DUM'
            ? nodeRegisterDirections
            : node.type === 'CMT'
            ? []
            : nodeTextDirections
        "
        :light="node.type === 'CMT'"
      >
        <NodeContentsRegister
          v-if="node.type === 'REG'"
          :op="node.op === '+' ? '+' : '–'"
          :index="node.index"
        />
        <NodeContentsComment
          v-else-if="node.type === 'CMT'"
          :text="node.comment"
        />
        <NodeContentsDummy v-else-if="node.type === 'DUM'" />
        <NodeContentsText v-else :text="node.type" />
      </Node>

      <Connector
        v-if="creatingConnector"
        :id="creatingConnector.id"
        :x1="creatingConnector.x1"
        :y1="creatingConnector.y1"
        :d1="creatingConnector.d1"
        :dummy1="creatingConnector.dummy1"
        :x2="creatingConnector.x2"
        :y2="creatingConnector.y2"
        :d2="creatingConnector.d2"
        :dummy2="creatingConnector.dummy2"
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
      <input
        class="grow"
        type="text"
        placeholder="Name"
        v-model="store.name"
        @change="persist"
      />
    </div>
    <div class="row">
      <button
        class="grow"
        :disabled="active"
        @click="onSaveClick"
        title="Save as File"
      >
        Save
      </button>
      <button
        class="grow"
        :disabled="active"
        @click="onOpenClick"
        title="Open from File"
      >
        Open
      </button>
      <button
        class="grow"
        :disabled="active"
        @click="onExportClick"
        title="Export as SVG"
      >
        Export
      </button>
      <button
        class="grow"
        :disabled="active || clipboardError"
        @click="onShareClick"
        :title="`Copy URL${clipboardError ? ' (Clipboard Unsupported)' : ''}`"
      >
        Share
      </button>
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
        @change="persist"
      />
    </div>
    <hr />
    <div class="row">
      <svg class="canvas" width="40" :height="30 * registerIndices.length">
        <g
          v-for="register in registerIndices"
          :key="register.index"
          :transform="register.transform"
          :class="{ active: activeRegister === register.index }"
        >
          <NodeContentsRegister :index="register.index" />
        </g>
      </svg>
      <div class="grow column">
        <input
          v-for="register in registerIndices"
          :key="register.index"
          type="number"
          placeholder="0"
          :disabled="store.playing"
          v-model.number="registerContents[register.index]"
          @change="persist"
        />
      </div>
    </div>
  </div>

  <div class="dummy">
    <a ref="download" />
    <input ref="file" type="file" @change="onFileChange" />
    <svg>
      <defs ref="exportDefs">
        <ConnectorDefs export />
      </defs>
    </svg>
  </div>
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
  active,
  nodeBoundingBoxes,
  registerIndices,
} from "./components/store";
import { registerContents, reset, step, playPause } from "./components/machine";
import { save, load, copyData, pasteData, persist } from "./components/data";
import {
  Direction,
  gridSpacing,
  nodeRegisterDirections,
  nodeTextDirections,
  nodeConnectionPointRadius,
  nodeRadius,
} from "./components/constants";
import NodeContentsText from "./components/NodeContentsText.vue";
import NodeContentsRegister from "./components/NodeContentsRegister.vue";
import NodeComponent from "./components/Node.vue";
import NodeContentsComment from "./components/NodeContentsComment.vue";
import exportCssPath from "./export.css.txt";
import NodeContentsDummy from "./components/NodeContentsDummy.vue";

let exportCss: string | undefined = undefined;

export default defineComponent({
  name: "Board",
  components: {
    NodeContentsDummy,
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
        [40, { type: "REG", op: "+", index: "0" }],
        [100, { type: "REG", op: "-", index: "0" }],
        [190, { type: "START" }],
        [310, { type: "HALT" }],
        [424, { type: "CMT", comment: "COMMENT", new: true }],
        [508, { type: "DUM" }],
      ],
      selectionBoundingBox,
      renderableNodesConnectors,
      nodeConnectionPointRadius,
      mouseGridCoords,
      registerContents,
      registerIndices,
      active,
      reset,
      step,
      playPause,
      persist,
    };
  },
  data() {
    return { clipboardError: false };
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
        dummy1: startNode.type === "DUM",
        n2: -1,
        d2: Direction.NONE,
        dummy2: false,
        alt: store.shiftKey,
        x1: startNode.x * gridSpacing,
        y1: startNode.y * gridSpacing,
        x2: store.mouseX - store.viewportX,
        y2: store.mouseY - store.viewportY,
      };
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
    async copyText(text: string): Promise<boolean> {
      try {
        const permission = await navigator.permissions.query({
          name: "clipboard-write" as any,
        });
        if (permission.state === "granted" || permission.state === "prompt") {
          await navigator.clipboard.writeText(text);
        }
      } catch (e) {
        this.clipboardError = true;
      }
    },
    async pasteText(): Promise<string | null> {
      try {
        const permission = await navigator.permissions.query({
          name: "clipboard-read" as any,
        });
        if (permission.state === "granted" || permission.state === "prompt") {
          return await navigator.clipboard.readText();
        }
      } catch (e) {
        this.clipboardError = true;
        return "";
      }
    },
    downloadFile(name: string, contents: string, type: string) {
      const blob = new Blob([contents], {
        type,
      });
      const url = URL.createObjectURL(blob);
      const download = this.$refs.download as HTMLAnchorElement;
      download.href = url;
      download.download = name;
      download.click();
      URL.revokeObjectURL(url);
    },

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
      store.selected.clear();

      if (
        store.downMouseX !== undefined &&
        store.downMouseY !== undefined &&
        store.downViewportX !== undefined &&
        store.downViewportY !== undefined
      ) {
        persist();
      }
      store.downMouseX = undefined;
      store.downMouseY = undefined;
      store.downViewportX = undefined;
      store.downViewportY = undefined;

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
        persist();
      }
    },
    async onKeyDown(e: KeyboardEvent) {
      // console.log("Board: onKeyDown:", e.key);
      const ctrlKey = e.ctrlKey || e.metaKey;
      store.shiftKey = e.shiftKey;
      store.ctrlKey = ctrlKey;
      if (ctrlKey && e.key === "c") {
        e.preventDefault();
        const data = copyData();
        await this.copyText(data);
        console.log("Copied", data);
      } else if (ctrlKey && e.key === "v") {
        e.preventDefault();
        const text = await this.pasteText();
        console.log("Pasted", text);
        pasteData(text);
        persist();
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
        persist();
      } else if (store.selected.size === 1) {
        e.preventDefault();
        const node = store.nodes[store.selected.values().next().value];
        if (node === undefined) return;
        if (node.type === "REG") {
          if (!isNaN(parseInt(e.key))) {
            const newIndex = parseInt(node.index + e.key);
            if (newIndex <= 99) node.index = newIndex.toString();
          } else if (e.key.length === 1) {
            const letter = e.key.toUpperCase();
            if ("A" <= letter && letter <= "Z") node.index = letter;
          } else if (e.key === "Backspace") {
            node.index = node.index.substring(0, node.index.length - 1) || "0";
          }
        } else if (node.type === "CMT") {
          if (node.new) {
            delete node.new;
            node.comment = "";
          }
          if (e.key.length === 1) {
            node.comment += e.key;
          } else if (e.key === "Backspace") {
            node.comment = node.comment.substring(0, node.comment.length - 1);
          }
        }
        persist();
      }
    },
    onKeyUp(e: KeyboardEvent) {
      // console.log("Board: onKeyUp:", e.key);
      store.shiftKey = e.shiftKey;
      store.ctrlKey = e.ctrlKey || e.metaKey;
    },

    onSaveClick() {
      const data = save();
      this.downloadFile(
        `${store.name || "Machine"}.json`,
        JSON.stringify(data),
        "application/json"
      );
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
        let data: SavedData;
        try {
          data = JSON.parse(reader.result as string);
          if (data.$rm !== true) return;
        } catch (e) {
          return;
        } finally {
          target.value = "";
        }
        load(data, file.name);
        persist();
      });
      reader.readAsText(file);
    },
    async onExportClick() {
      if (exportCss === undefined) {
        exportCss = await (await fetch(exportCssPath)).text();
      }
      let minX = 0;
      let minY = 0;
      let maxX = 0;
      let maxY = 0;
      for (const node of nodeBoundingBoxes.value) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
      }
      const margin = nodeRadius;
      minX -= margin;
      minY -= margin;
      maxX += margin;
      maxY += margin;
      const width = maxX - minX;
      const height = maxY - minY;
      const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">`,
        "<style>",
        exportCss,
        "</style>",
        this.$refs.exportDefs.outerHTML,
        '<g class="root">',
        this.$refs.viewport.innerHTML,
        "</g>",
        "</svg>",
      ].join("\n");
      this.downloadFile(`${store.name || "Machine"}.svg`, svg, "image/svg+xml");
    },
    async onShareClick() {
      const data = save();
      const url = `${window.location.origin}/#${btoa(JSON.stringify(data))}`;
      await this.copyText(url);
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

  .get-started {
    fill: #999999;
  }

  .node {
    &.light {
      color: #999999;
    }
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

  button {
    padding: 0 2px;
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
    + .row {
      margin-top: 0.5rem;
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

.dummy {
  display: none;
}
</style>
