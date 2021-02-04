import "modern-normalize/modern-normalize.css";
import { createApp } from "vue";
import App from "./App.vue";
import { load, loadPersisted, persist } from "./components/data";

// Try to load data from hash
let loadPromise: Promise<void> | undefined = undefined;
if (window.location.hash.length > 0) {
  try {
    load(JSON.parse(atob(window.location.hash.substring(1))));
    persist();
    loadPromise = Promise.resolve();
  } catch (e) {
    console.error("Error parsing hash:", e);
  } finally {
    window.location.hash = "";
  }
}
// If no valid hash provided, load persisted data instead
if (loadPromise === undefined) loadPromise = loadPersisted();

loadPromise.then(() => createApp(App).mount("#app"));
