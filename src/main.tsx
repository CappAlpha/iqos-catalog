import { BProgress } from "@bprogress/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { IS_ANDROID, IS_CAPACITOR } from "@/shared/config";

import App from "./app/App";

BProgress.start();

if (IS_CAPACITOR && IS_ANDROID) {
  try {
    const { checkApkUpdate } = await import("@/shared/lib/apkUpdater");
    await checkApkUpdate();
  } catch (error: unknown) {
    console.error("Ошибка проверки обновления приложения", error);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
