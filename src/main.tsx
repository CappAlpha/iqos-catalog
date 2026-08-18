import { BProgress } from "@bprogress/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";

BProgress.start();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
