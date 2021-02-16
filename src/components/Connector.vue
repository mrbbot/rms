<template>
  <path
    class="connector"
    :class="{ creating, selected, active, error }"
    :d="path"
    stroke="currentColor"
    fill="transparent"
    stroke-width="2"
    stroke-linecap="round"
    :marker-end="marker"
    :data-id="id"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  Direction,
  directionOffsets,
  dummyDivisionFactor,
  spacingOffsets,
} from "./constants";
import { store, storeNodeConnectors } from "./store";

export default defineComponent({
  name: "Connector",
  props: {
    id: { type: Number, required: true },
    x1: { type: Number, required: true },
    y1: { type: Number, required: true },
    d1: { type: Number, required: true },
    dummy1: { type: Boolean, required: true },
    x2: { type: Number, required: true },
    y2: { type: Number, required: true },
    d2: { type: Number, required: true },
    dummy2: { type: Boolean, required: true },
    alt: Boolean,
    creating: Boolean,
  },
  computed: {
    path(): string {
      let { x: o1x, y: o1y } = directionOffsets[this.d1 as Direction];
      let { x: o2x, y: o2y } = directionOffsets[this.d2 as Direction];
      if (this.dummy1) {
        o1x /= dummyDivisionFactor;
        o1y /= dummyDivisionFactor;
      }
      if (this.dummy2) {
        o2x /= dummyDivisionFactor;
        o2y /= dummyDivisionFactor;
      }

      const x1 = this.x1 + o1x;
      const y1 = this.y1 + o1y;
      const x2 = this.x2 + o2x;
      const y2 = this.y2 + o2y;

      if (x1 === x2 && y1 === y2) {
        // assert(d1 === d2 && o1 === o2)

        // Ignore _TEXT directions
        let d = this.d1;
        if (d === Direction.EAST_TEXT) d = Direction.EAST;
        else if (d === Direction.WEST_TEXT) d = Direction.WEST;

        // Spacing offsets
        const spacing = spacingOffsets[d as Direction];
        const sx = spacing.x * 0.5;
        const sy = spacing.y * 0.5;

        // Control point origins
        const { x: ox, y: oy } = directionOffsets[d as Direction];
        const cx = x1 + ox;
        const cy = y1 + oy;
        const cxs = sx * 4;
        const cys = sy * 4;

        return (
          `M ${x1 + sx} ${y1 + sy} ` +
          `C ${cx + cxs} ${cy + cys}, ${cx - cxs} ${cy - cys}, ` +
          `${x1 - sx} ${y1 - sy}`
        );
      }

      return `M ${x1} ${y1} L ${x2} ${y2}`;
    },
    selected(): boolean {
      return store.selected.has(this.id);
    },
    active(): boolean {
      return store.activeConnector === this.id;
    },
    error(): boolean {
      return storeNodeConnectors.value.connectorErrors.has(this.id);
    },
    marker(): string {
      return `url(#${
        this.creating || this.selected
          ? "selected-"
          : this.active
          ? "active-"
          : this.error
          ? "error-"
          : ""
      }${this.alt ? "arrow-double" : "arrow"})`;
    },
  },
});
</script>
