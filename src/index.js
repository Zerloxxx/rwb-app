import React from "react";
import { createRoot } from "react-dom/client";
// import "./index.css"; // ← временно убираем, чтобы не мешал сборке
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
