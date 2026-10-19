import { createBrowserRouter, RouterProvider } from "react-router";

import { ROUTER_BASENAME } from "@/shared/config";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppHeader } from "../layout/AppHeader";
import { AppLayout } from "../layout/AppLayout";
import { lazyRouteChildren } from "./routeConfig";
import { ErrorPage } from "./ui/ErrorPage";
import { NotFoundPage } from "./ui/NotFoundPage";

const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      errorElement: <ErrorPage />,
      hydrateFallbackElement: (
        <>
          <AppHeader />
          <PageLoader />
        </>
      ),
      children: [
        ...lazyRouteChildren(),
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  { basename: ROUTER_BASENAME },
);

export const AppRoutes = () => <RouterProvider router={router} />;
