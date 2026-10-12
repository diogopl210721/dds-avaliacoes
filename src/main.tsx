import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// ui.css antes do Tailwind: as classes utilitárias (hidden, sm:…) sempre têm a palavra final.
import "./ui.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
