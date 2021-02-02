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
import { Direction, directionOffsets, spacingOffsets } from "./constants";
import { store, storeNodeConnectors } from "./store";

export default defineComponent({
  name: "Connector",
  props: {
    id: { type: Number, required: true },
    x1: { type: Number, required: true },
    y1: { type: Number, required: true },
    d1: { type: Number, required: true },
    x2: { type: Number, required: true },
    y2: { type: Number, required: true },
    d2: { type: Number, required: true },
    // curve: Boolean, // M 130 200 C 150 210, 200 210, 220 200
    alt: Boolean,
    creating: Boolean,
  },
  computed: {
    path(): string {
      const o1 = directionOffsets[this.d1 as Direction];
      const o2 = directionOffsets[this.d2 as Direction];

      const x1 = this.x1 + o1.x;
      const y1 = this.y1 + o1.y;
      const x2 = this.x2 + o2.x;
      const y2 = this.y2 + o2.y;

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
        const o = directionOffsets[d as Direction];
        const cx = x1 + o.x;
        const cy = y1 + o.y;
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
