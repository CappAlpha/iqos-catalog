import { Route, Routes } from "react-router";

import { Cart } from "@/modules/cart/pages/ui/cart";
import { Catalog } from "@/modules/catalog/pages/ui/catalog";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  );
};
