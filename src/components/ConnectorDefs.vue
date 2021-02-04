<template>
  <template v-for="[prefix, colour] in colours" :key="prefix">
    <marker
      :id="prefix + 'arrow'"
      markerWidth="2.5"
      markerHeight="5"
      refX="2.5"
      refY="2.5"
      orient="auto"
      overflow="visible"
    >
      <path
        d="M 0 0 C 0.5 1.25, 1.25 2.5, 2.5 2.5 M 0 5 C 0.5 3.75, 1.25 2.5, 2.5 2.5"
        :stroke="colour"
        fill="transparent"
        stroke-linecap="round"
      />
    </marker>
    <marker
      :id="prefix + 'arrow-double'"
      markerWidth="5"
      markerHeight="5"
      refX="5"
      refY="2.5"
      orient="auto"
      overflow="visible"
    >
      <path
        d="M 0 0 C 0.5 1.25, 1.25 2.5, 2.5 2.5 M 0 5 C 0.5 3.75, 1.25 2.5, 2.5 2.5 M 2.5 0 C 3 1.25, 3.75 2.5, 5 2.5 M 2.5 5 C 3 3.75, 3.75 2.5, 5 2.5"
        :stroke="colour"
        fill="transparent"
        stroke-linecap="round"
      />
    </marker>
  </template>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ConnectorDefs",
  props: {
    export: Boolean,
  },
  setup(props) {
    return {
      colours: Object.entries({
        "": "currentColor",
        "error-": props.export ? "currentColor" : "#f44336",
        "active-": props.export ? "currentColor" : "#4caf50",
        "selected-": props.export ? "currentColor" : "#0094ff",
      }),
    };
  },
});
</script>
