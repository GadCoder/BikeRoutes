import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Support opening shared routes via /?share=<token>
const params = new URLSearchParams(window.location.search);
const share = params.get("share");
if (share) {
  // Leave routing to App; keep URL as-is.
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

