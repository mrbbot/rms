import "modern-normalize/modern-normalize.css";
import { createApp } from "vue";
import App from "./App.vue";
import { loadPersisted } from "./components/data";

loadPersisted().then(() => createApp(App).mount("#app"));
