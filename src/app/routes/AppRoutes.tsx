import { Route, Routes } from "react-router";

import { Catalog } from "../../modules/catalog/pages/ui/catalog";
import { Cart } from "../../modules/cart/pages/ui/cart";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  );
};
