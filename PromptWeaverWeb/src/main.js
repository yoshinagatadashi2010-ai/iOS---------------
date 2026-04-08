function escapeHtml(value) {
  return `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderLoading() {
  const root = document.getElementById("app");
  if (!root) return;
  root.innerHTML = `
    <div style="max-width: 880px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #102033;">
      <h1 style="margin: 0 0 12px; font-size: 28px;">PromptWeaver</h1>
      <p style="margin: 0; line-height: 1.7; color: #5b6b7f;">\u8aad\u307f\u8fbc\u307f\u4e2d\u3067\u3059\u3002\u3053\u306e\u753b\u9762\u306e\u307e\u307e\u6b62\u307e\u308b\u3068\u304d\u306f\u3001\u305d\u306e\u307e\u307e\u30b9\u30af\u30ea\u30fc\u30f3\u30b7\u30e7\u30c3\u30c8\u3092\u9001\u3063\u3066\u304f\u3060\u3055\u3044\u3002</p>
    </div>
  `;
}

function renderFatalError(error) {
  const message = error?.stack || error?.message || `${error ?? "Unknown error"}`;
  document.body.innerHTML = `
    <div style="max-width: 880px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #102033;">
      <h1 style="margin: 0 0 12px; font-size: 28px;">\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc</h1>
      <p style="margin: 0 0 16px; line-height: 1.7; color: #5b6b7f;">\u753b\u9762\u3092\u8868\u793a\u3059\u308b\u9014\u4e2d\u3067\u6b62\u307e\u3063\u3066\u3044\u307e\u3059\u3002\u4e0b\u306e\u6587\u5b57\u3092\u305d\u306e\u307e\u307e\u9001\u3063\u3066\u304f\u3060\u3055\u3044\u3002</p>
      <pre style="white-space: pre-wrap; word-break: break-word; background: #f4f7fb; border: 1px solid #d7e2ef; border-radius: 8px; padding: 16px; line-height: 1.6;">${escapeHtml(message)}</pre>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  renderFatalError(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  renderFatalError(event.reason);
});

async function startApp() {
  renderLoading();

  const [{ PromptWeaverStore }, { AppRenderer }] = await Promise.all([
    import("./core/store.js"),
    import("./ui/renderer.js")
  ]);

  const root = document.getElementById("app");
  if (!root) {
    throw new Error("Cannot find #app root element.");
  }

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
      // Ignore cache cleanup failures in local development.
    });
  } else if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js", { scope: "./", updateViaCache: "none" })
        .catch(() => {
          // Ignore service worker registration errors.
        });
    });
  }
}

startApp().catch((error) => {
  renderFatalError(error);
});
