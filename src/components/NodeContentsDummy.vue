<template>
  <circle class="background" :r="nodeRadius" />
  <circle fill="currentColor" :r="nodeDummyRadius" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { nodeDummyRadius, nodeRadius } from "./constants";

export default defineComponent({
  name: "NodeContentsDummy",
  setup() {
    return { nodeRadius, nodeDummyRadius };
  },
});
</script>
