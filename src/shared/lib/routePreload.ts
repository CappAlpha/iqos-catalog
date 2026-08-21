import type { ComponentType } from "react";
import type { RouteObject } from "react-router";

import { ROUTES } from "@/shared/config";

const routeLoaders = {
  [ROUTES.CATALOG]: () => import("@/modules/catalog/pages/ui/catalog"),
  [ROUTES.CART]: () => import("@/modules/cart/pages/ui/cart"),
  [ROUTES.BLUETOOTH]: () => import("@/modules/bluetooth/pages/ui/bluetooth"),
  [ROUTES.USB]: () => import("@/modules/usb/pages/ui/usb"),
} as const;

export type TRoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const preloadRoute = (to: string): void => {
  const cleanPath = to.split("?")[0].split("#")[0] as TRoutePath;
  const loader = routeLoaders[cleanPath];
  if (loader) {
    void loader();
  }
};

const lazyRoute = (path: TRoutePath) => async () => {
  const module = await routeLoaders[path]();
  return { Component: module.default as ComponentType };
};

export const lazyRouteChildren = (): RouteObject[] =>
  Object.keys(routeLoaders).map((path) => ({
    path,
    lazy: lazyRoute(path as TRoutePath),
  }));
