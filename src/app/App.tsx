import { BrowserRouter } from "react-router";

import "@/app/styles/colors.scss";
import "@/app/styles/global.scss";
import "@/app/styles/reset.scss";

import { AppLayout } from "./layout/AppLayout";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
