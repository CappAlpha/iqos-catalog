import { createBrowserRouter, RouterProvider } from "react-router";

import { ROUTER_BASENAME, ROUTES } from "@/shared/config";
import { lazyRoute } from "@/shared/lib/routePreload";
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
        {
          path: ROUTES.CATALOG,
          lazy: lazyRoute(ROUTES.CATALOG),
        },
        {
          path: ROUTES.CART,
          lazy: lazyRoute(ROUTES.CART),
        },
        {
          path: ROUTES.BLUETOOTH,
          lazy: lazyRoute(ROUTES.BLUETOOTH),
        },
        {
          path: ROUTES.USB,
          lazy: lazyRoute(ROUTES.USB),
        },
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
