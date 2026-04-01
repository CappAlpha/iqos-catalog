import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

import "@/app/styles/_reset.scss";
import "@/app/styles/colors.scss";
import "@/app/styles/global.scss";

import { AppLayout } from "./layout/AppLayout";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
        <Toaster position="top-center" richColors className="toast-root" />
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
