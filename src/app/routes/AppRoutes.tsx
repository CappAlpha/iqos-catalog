import { createBrowserRouter, RouterProvider } from "react-router";

import { ROUTER_BASENAME } from "@/shared/config";
import { lazyRouteChildren } from "@/shared/lib/routePreload";
import { Header } from "@/shared/ui/Header";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppLayout } from "../layout/AppLayout";
import { ErrorPage } from "./ui/ErrorPage";
import { NotFoundPage } from "./ui/NotFoundPage";

const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      errorElement: <ErrorPage />,
      hydrateFallbackElement: (
        <>
          <Header />
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
