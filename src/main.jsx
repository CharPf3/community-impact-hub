import React from "react";
import { createRoot } from "react-dom/client";
import CIHMatrixExplorer from "../cih-matrix-explorer.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CIHMatrixExplorer />
  </React.StrictMode>
);
