<template>
  <g
    class="node"
    :class="{ selected, active }"
    :transform="transform"
    :data-id="id"
    @mousedown="onMouseDown"
  >
    <slot />
    <template v-if="directions">
      <circle
        v-for="(direction, i) of directions"
        :key="i"
        class="connection-point"
        :r="nodeConnectionPointRadius"
        :cx="direction.x"
        :cy="direction.y"
        @mousedown="onConnectionPointMouseDown($event, direction.direction)"
        @mouseup="onConnectionPointMouseUp($event, direction.direction)"
      />
    </template>
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Direction, nodeConnectionPointRadius } from "./constants";
import { store, mouseGridCoords } from "./store";

export default defineComponent({
  name: "Node",
  props: {
    id: { type: Number, required: true },
    x: { required: true },
    y: { required: true },
    directions: { type: Array },
    template: Object,
  },
  setup() {
    return { nodeConnectionPointRadius };
  },
  computed: {
    transform(): string {
      return `translate(${this.x}, ${this.y})`;
    },
    selected(): boolean {
      return store.selected.has(this.id);
    },
    active(): boolean {
      return store.activeNode === this.id;
    },
  },
  methods: {
    onMouseDown(e: MouseEvent) {
      // console.log("Node: onMouseDown:", this.id);
      e.stopPropagation();
      if (store.playing) return;
      if (this.template) {
        const id = store.nextId++;
        const [newX, newY] = mouseGridCoords.value;
        store.nodes[id] = {
          id: id,
          x: newX,
          y: newY,
          ...this.template,
        } as any;
        store.movingNode = id;
        store.movingNodeStartX = undefined;
        store.movingNodeStartY = undefined;
      } else {
        store.movingNode = this.id;
        store.movingNodeStartX = store.nodes[this.id].x;
        store.movingNodeStartY = store.nodes[this.id].y;
      }
    },
    onConnectionPointMouseDown(e: MouseEvent, direction: Direction) {
      // console.log("Node: onConnectionPointMouseDown:", this.id, direction);
      e.stopPropagation();
      if (store.playing) return;
      store.connectorStartNode = this.id;
      store.connectorStartDirection = direction;
    },
    onConnectionPointMouseUp(e: MouseEvent, direction: Direction) {
      // console.log("Node: onConnectionPointMouseUp:", this.id, direction);
      if (store.playing) return;
      if (
        store.connectorStartNode !== undefined &&
        store.connectorStartDirection !== undefined
      ) {
        e.stopPropagation();
        // console.log("Node: onConnectionPointMouseUp: connecting");

        const id = store.nextId++;
        store.connectors[id] = {
          id,
          n1: store.connectorStartNode,
          d1: store.connectorStartDirection,
          n2: this.id,
          d2: direction,
          alt: e.shiftKey ? true : undefined,
        };

        store.selected.clear();
        store.selected.add(id);
        store.connectorStartNode = undefined;
        store.connectorStartDirection = undefined;
      }
    },
  },
});
</script>
