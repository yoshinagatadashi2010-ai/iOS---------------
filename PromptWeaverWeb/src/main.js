import { PromptWeaverStore } from "./core/store.js";
import { AppRenderer } from "./ui/renderer.js";

const root = document.getElementById("app");
const store = new PromptWeaverStore();
const renderer = new AppRenderer(root, store);

renderer.init();

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

async function clearLocalDevelopmentCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await window.caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("promptweaver-web-"))
        .map((key) => window.caches.delete(key))
    );
  }
}

if (isLocalHost) {
  clearLocalDevelopmentCaches().catch(() => {
    // ローカル確認ではキャッシュの解除に失敗しても利用自体は継続する。
  });
} else if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./", updateViaCache: "none" })
      .catch(() => {
        // サービスワーカーが登録できない環境でも通常利用は継続する。
      });
  });
}