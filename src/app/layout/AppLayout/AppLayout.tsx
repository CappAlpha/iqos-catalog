import { Outlet, useNavigation } from "react-router";

import { Header } from "@/shared/ui/Header";
import { PageLoader } from "@/shared/ui/PageLoader";
import { PageProgressBar } from "@/shared/ui/PageProgressBar";

export const AppLayout = () => {
  const { state } = useNavigation();
  const isNavigating = state === "loading" || state === "submitting";

  return (
    <>
      <PageProgressBar state={state} />
      <Header />
      {isNavigating ? <PageLoader /> : <Outlet />}
    </>
  );
};
