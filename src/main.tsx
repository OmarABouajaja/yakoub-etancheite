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
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Loading CSS chunk')
  ) {
    const reloaded = sessionStorage.getItem('chunk-reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
    const reloaded = sessionStorage.getItem('chunk-reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
