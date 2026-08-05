import { createBrowserRouter, RouterProvider } from "react-router";

import { NotFoundPage } from "@/modules/not-found/pages/ui/NotFoundPage";
import { IS_CAPACITOR } from "@/shared/config/platform";
import { Header } from "@/shared/ui/Header";
import { PageLoader } from "@/shared/ui/PageLoader";

import { AppLayout } from "../layout/AppLayout";

const ROUTER_BASENAME = IS_CAPACITOR ? "/" : "/iqos-catalog/";

const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
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
