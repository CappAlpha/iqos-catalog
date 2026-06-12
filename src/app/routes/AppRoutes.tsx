import { Route, Routes } from "react-router";

import { BluetoothPage } from "@/modules/bluetooth/pages/ui/bluetooth";
import { CartPage } from "@/modules/cart/pages/ui/cart";
import { CatalogPage } from "@/modules/catalog/pages/ui/catalog";
import { UsbPage } from "@/modules/usb/pages/ui/usb";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/bluetooth" element={<BluetoothPage />} />
      <Route path="/usb" element={<UsbPage />} />
    </Routes>
  );
};
