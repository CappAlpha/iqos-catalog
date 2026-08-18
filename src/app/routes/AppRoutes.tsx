import { createBrowserRouter, RouterProvider } from "react-router";

import { IS_CAPACITOR } from "@/shared/config/platform";
import { Header } from "@/shared/ui/Header";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppLayout } from "../layout/AppLayout";
import { ErrorPage } from "./ui/ErrorPage";
import { NotFoundPage } from "./ui/NotFoundPage";

const ROUTER_BASENAME = IS_CAPACITOR ? "/" : "/iqos-catalog/";

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
          path: "/",
          lazy: async () => ({
            Component: (await import("@/modules/catalog/pages/ui/catalog"))
              .default,
          }),
        },
        {
          path: "/cart",
          lazy: async () => ({
            Component: (await import("@/modules/cart/pages/ui/cart")).default,
          }),
        },
        {
          path: "/bluetooth",
          lazy: async () => ({
            Component: (await import("@/modules/bluetooth/pages/ui/bluetooth"))
              .default,
          }),
        },
        {
          path: "/usb",
          lazy: async () => ({
            Component: (await import("@/modules/usb/pages/ui/usb")).default,
          }),
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
