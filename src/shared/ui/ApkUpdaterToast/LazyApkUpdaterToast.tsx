import { lazy, Suspense } from "react";

import { IS_ANDROID, IS_CAPACITOR } from "@/shared/config/platform";

const ApkUpdaterToast =
  IS_CAPACITOR && IS_ANDROID ? lazy(() => import("./ApkUpdaterToast")) : null;

export function LazyApkUpdaterToast() {
  if (!ApkUpdaterToast) return null;

  return (
    <Suspense fallback={null}>
      <ApkUpdaterToast />
    </Suspense>
  );
}
