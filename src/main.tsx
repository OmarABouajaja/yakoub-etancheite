import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA — auto update silently on new deployment
const updateSW = registerSW({
  onNeedRefresh() {
    // Silently update instead of prompting — prevents stale chunk issues
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
});

// Global handler: if a lazy-loaded chunk fails (stale cache), force reload once
window.addEventListener('vite:preloadError', () => {
  const reloaded = sessionStorage.getItem('chunk-reload');
  if (!reloaded) {
    sessionStorage.setItem('chunk-reload', '1');
    window.location.reload();
  }
});

window.addEventListener('error', (event) => {
  const msg = event.message || "";
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('Strict MIME type checking is enforced')
  ) {
    const reloaded = sessionStorage.getItem('chunk-reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || "";
  if (reason.includes('Failed to fetch dynamically imported module') || reason.includes('Strict MIME type')) {
    const reloaded = sessionStorage.getItem('chunk-reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);

// Reset reload flag on successful mount
setTimeout(() => {
  sessionStorage.removeItem('chunk-reload');
}, 1000);
