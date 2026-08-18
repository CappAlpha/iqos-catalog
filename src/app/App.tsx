import { Suspense } from "react";
import { Toaster } from "sonner";

import "@/app/styles/global.scss";
import { useVH } from "@/shared/hooks/useVh";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
  useVH();

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
