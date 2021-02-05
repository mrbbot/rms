<template>
  <circle class="background" :r="nodeRadius" />
  <text
    :x="!op && alphabetic ? -15 : 0"
    y="2"
    :text-anchor="!op && alphabetic ? 'start' : 'end'"
    dominant-baseline="middle"
    fill="currentColor"
    >{{ alphabetic ? index : "R" }}</text
  >
  <text
    v-if="op"
    x="0"
    y="-8"
    text-anchor="start"
    dominant-baseline="middle"
    fill="currentColor"
    >{{ op }}</text
  >
  <text
    v-if="!alphabetic"
    class="script"
    x="2"
    y="8"
    text-anchor="start"
    dominant-baseline="middle"
    fill="currentColor"
    >{{ index }}</text
  >
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { nodeRadius } from "./constants";

export default defineComponent({
  name: "NodeContentsRegister",
  props: {
    op: {
      type: String,
    },
    index: {
      type: String,
      required: true,
    },
  },
  setup() {
    return { nodeRadius };
  },
  computed: {
    alphabetic() {
      return "A" <= this.index && this.index <= "Z";
    },
  },
});
</script>
