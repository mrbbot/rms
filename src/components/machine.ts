import { reactive } from "vue";
import { RegisterContents, store, storeNodeConnectors } from "./store";

let initialRegisterContents: RegisterContents | undefined = undefined;

export const registerContents = reactive(
  new Proxy<RegisterContents>(
    {},
    {
      get(target, key): any {
        if (key === Symbol.toStringTag) return undefined;
        return target[key as string] || "";
      },
      set(target, key, value): boolean {
        if (value) {
          target[key as string] = Math.abs(value);
        } else {
          delete target[key as string];
        }
        return true;
      },
    }
  )
);

export function loadRegisterContents(contents: RegisterContents) {
  for (const key of Object.keys(registerContents)) {
    delete registerContents[key as any];
  }
  for (const [index, value] of Object.entries(contents)) {
    registerContents[index.toString()] = value;
  }
}

let intervalHandle: number | undefined = undefined;

export function reset() {
  clearTimeout(intervalHandle);

  if (initialRegisterContents !== undefined) {
    loadRegisterContents(initialRegisterContents);
    initialRegisterContents = undefined;
  }

  store.playing = false;
  store.activeNode = undefined;
  store.activeConnector = undefined;
  store.selected.clear();
}

export function step(): boolean {
  if (initialRegisterContents === undefined) {
    initialRegisterContents = Object.fromEntries(
      Object.entries(registerContents)
    );
  }

  store.activeConnector = undefined;
  store.selected.clear();

  // Find start
  if (store.activeNode === undefined) {
    store.activeNode = Object.values(store.nodes).find(
      (node) => node.type === "START"
    )?.id;
    return true;
  }

  const node = store.nodes[store.activeNode];
  if (node === undefined) {
    // If we deleted the active node
    store.activeNode = undefined;
    return false;
  }
  const connected = storeNodeConnectors.value.nodeConnectedNodes[node.id];
  if (connected === undefined) return false;

  if (node.type === "START" && connected.primary) {
    store.activeConnector = connected.primary.via;
    store.activeNode = connected.primary.nodeId;
    return true;
  } else if (node.type === "REG") {
    const value = registerContents[node.index] || 0;
    if (node.op === "+" && connected.primary) {
      registerContents[node.index] = value + 1;
      store.activeConnector = connected.primary.via;
      store.activeNode = connected.primary.nodeId;
      return true;
    } else if (node.op === "-") {
      if (value === 0 && connected.alt) {
        store.activeConnector = connected.alt.via;
        store.activeNode = connected.alt.nodeId;
        return true;
      } else if (value > 0 && connected.primary) {
        registerContents[node.index] = value - 1;
        store.activeConnector = connected.primary.via;
        store.activeNode = connected.primary.nodeId;
        return true;
      }
    }
  }

  return false;
}

function intervalHandler() {
  const timeout = (9 - store.playSpeed) * 125;
  if (step()) {
    intervalHandle = setTimeout(intervalHandler, timeout);
  } else {
    store.playing = false;
  }
}

export function playPause() {
  clearTimeout(intervalHandle);
  store.playing = !store.playing;
  if (store.playing) intervalHandler();
}
