import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";
import { Toaster } from "sonner";

import "@/app/styles/global.scss";
import { IQOS_ORIGIN } from "@/shared/config";
import { useVh } from "@/shared/hooks/useVh";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
  preconnect(IQOS_ORIGIN);
  prefetchDNS(IQOS_ORIGIN);

  useVh();

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
