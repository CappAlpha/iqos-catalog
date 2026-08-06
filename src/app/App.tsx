import { Suspense, useEffect } from "react";
import { Toaster } from "sonner";

import "@/app/styles/global.scss";
import { cartM } from "@/modules/cart/features/model/cartM";
import { useVH } from "@/shared/hooks/useVh";
import { LazyApkUpdaterToast } from "@/shared/ui/ApkUpdaterToast";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
  useVH();

  useEffect(() => {
    void cartM.initStore();
  }, []);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
      <LazyApkUpdaterToast />
      <Toaster position="top-center" richColors className="toast-root" />
    </>
  );
}

export default App;
