<template>
  <circle class="background" :r="nodeRadius" />
  <text
    x="0"
    y="2"
    text-anchor="end"
    dominant-baseline="middle"
    fill="currentColor"
    >R</text
  >
  <text
    x="0"
    y="-8"
    text-anchor="start"
    dominant-baseline="middle"
    fill="currentColor"
    ><slot name="sup"
  /></text>
  <text
    class="script"
    x="2"
    y="8"
    text-anchor="start"
    dominant-baseline="middle"
    fill="currentColor"
    ><slot name="sub"
  /></text>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { nodeRadius } from "./constants";

export default defineComponent({
  name: "NodeContentsRegister",
  setup() {
    return { nodeRadius };
  },
});
</script>
