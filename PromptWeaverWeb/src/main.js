import { PromptWeaverStore } from "./core/store.js";
import { AppRenderer } from "./ui/renderer.js";

const root = document.getElementById("app");
const store = new PromptWeaverStore();
const renderer = new AppRenderer(root, store);

renderer.init();

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
      // サービスワーカーが登録できない環境でも通常利用は継続する。
    });
  });
}
