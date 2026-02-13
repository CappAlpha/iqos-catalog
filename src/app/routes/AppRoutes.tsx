import { Route, Routes } from "react-router";

import { Catalog } from "../../modules/catalog/pages/ui/catalog";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
    </Routes>
  );
};
