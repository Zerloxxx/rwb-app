import React from "react";
import { createRoot } from "react-dom/client";
// import "./index.css"; // ← временно убираем, чтобы не мешал сборке
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="min-h-dvh w-full flex justify-center bg-neutral-900">
      <div className="w-full max-w-[430px] min-h-dvh bg-[#0f0f0f] overflow-hidden">
        <App />
      </div>
    </div>
  </React.StrictMode>
);
