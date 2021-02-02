<template>
  <rect
    class="background"
    :x="-nodeTextWidth / 2"
    :y="-nodeTextHeight / 2"
    :width="nodeTextWidth"
    :height="nodeTextHeight"
    :rx="nodeRadius"
  />
  <text
    class="text"
    x="0"
    y="2"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="currentColor"
    >{{ text }}</text
  >
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { nodeRadius, nodeTextWidth, nodeTextHeight } from "./constants";

export default defineComponent({
  name: "NodeContentsText",
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup() {
    return { nodeRadius, nodeTextWidth, nodeTextHeight };
  },
});
</script>
