import { lazy } from "react";

export const preloadProductModal = () => import("./ProductModal");

export const LazyProductModal = lazy(() =>
  preloadProductModal().then((module) => ({
    default: module.ProductModal,
  })),
);
