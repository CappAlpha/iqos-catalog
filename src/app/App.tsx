import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

import "@/app/styles/_reset.scss";
import "@/app/styles/colors.scss";
import "@/app/styles/global.scss";
import { cartM } from "@/modules/cart/features/model/cartM";
import { IS_CAPACITOR } from "@/shared/config/platform";
import { useVH } from "@/shared/lib/useVh";

import { AppLayout } from "./layout/AppLayout";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  const routerBasename = IS_CAPACITOR ? "/" : "/iqos-catalog/";

  useVH();

  useEffect(() => {
    void cartM.initStore();
  }, []);

  return (
    <BrowserRouter basename={routerBasename}>
      <AppLayout>
        <AppRoutes />
        <Toaster position="top-center" richColors className="toast-root" />
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
