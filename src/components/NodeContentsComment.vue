<template>
  <rect
    class="background"
    :x="-width / 2"
    :y="-nodeCommentHeight / 2"
    :width="width"
    :height="nodeCommentHeight"
    :rx="nodeCommentHeight / 2"
  />
  <text
    class="text comment"
    x="0"
    y="1"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="currentColor"
    >{{ text }}</text
  >
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { nodeRadius, nodeCommentWidth, nodeCommentHeight } from "./constants";

export default defineComponent({
  name: "NodeContentsComment",
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup() {
    return { nodeRadius, nodeCommentHeight };
  },
  computed: {
    width(): number {
      return nodeCommentWidth(this.text);
    },
  },
});
</script>
