import "modern-normalize/modern-normalize.css";
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");

window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
});
