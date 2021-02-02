<template>
  <Board />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Board from "./Board.vue";

export default defineComponent({
  name: "App",
  components: { Board },
});
</script>

<style>
#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #f0f0f0;
}
</style>
