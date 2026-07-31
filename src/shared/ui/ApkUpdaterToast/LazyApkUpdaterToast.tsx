import { lazy, Suspense } from "react";

import { IS_ANDROID } from "@/shared/config/platform";

const ApkUpdaterToast =
  import.meta.env.MODE === "capacitor" && IS_ANDROID
    ? lazy(() => import("./ApkUpdaterToast"))
    : null;

export function LazyApkUpdaterToast() {
  if (!ApkUpdaterToast) return null;

  return (
    <Suspense fallback={null}>
      <ApkUpdaterToast />
    </Suspense>
  );
}
