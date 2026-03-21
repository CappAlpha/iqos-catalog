import { Route, Routes } from "react-router";

import { CartPage } from "@/modules/cart/pages/ui/cart";
import { CatalogPage } from "@/modules/catalog/pages/ui/catalog";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/cart" element={<CartPage />} />
    </Routes>
  );
};
