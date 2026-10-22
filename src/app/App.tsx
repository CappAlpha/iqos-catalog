import { Suspense, useEffect } from "react";
import { preconnect, prefetchDNS } from "react-dom";
import { Toaster } from "sonner";

import "@/app/styles/global.scss";
import { IQOS_ORIGIN, IS_ANDROID } from "@/shared/config";
import { useVh } from "@/shared/hooks/useVh";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
  preconnect(IQOS_ORIGIN);
  prefetchDNS(IQOS_ORIGIN);

  useVh();

  useEffect(() => {
    if (!IS_ANDROID) return;

    void import("@/shared/lib/apkUpdater")
      .then(({ checkApkUpdate }) => checkApkUpdate())
      .catch((error: unknown) => {
        console.error("Ошибка проверки обновления приложения", error);
      });
  }, []);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
      <Toaster position="top-center" richColors className="toast-root" />
    </>
  );
}

export default App;
