import { Outlet, useNavigation } from "react-router";

import { PageLoader } from "@/shared/ui/PageLoader";
import { PageProgressBar } from "@/shared/ui/PageProgressBar";

import { AppHeader } from "../AppHeader";

export const AppLayout = () => {
  const { state } = useNavigation();
  const isNavigating = state === "loading" || state === "submitting";

  return (
    <>
      <PageProgressBar state={state} />
      <AppHeader />
      {isNavigating ? <PageLoader /> : <Outlet />}
    </>
  );
};
