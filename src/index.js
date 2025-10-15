import React from "react";
import { createRoot } from "react-dom/client";
// import "./index.css"; // ← временно убираем, чтобы не мешал сборке
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="min-h-[100svh] w-full flex justify-center bg-neutral-900" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-[430px] min-h-[100svh] bg-[#0f0f0f] overflow-x-hidden overflow-y-auto">
        <App />
      </div>
    </div>
  </React.StrictMode>
);
