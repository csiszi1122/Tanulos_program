import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    // Pull fresh builds on tablet/PWA so new modules (e.g. Rajzolás) appear.
    void registration?.update();
    window.setInterval(() => void registration?.update(), 60 * 60 * 1000);
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
