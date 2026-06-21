import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { lazy, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router";

NProgress.configure({
  showSpinner: false,
  speed: 350,
  trickleSpeed: 170,
  minimum: 0.05,
});

const CatalogPage = lazy(() => import("@/modules/catalog/pages/ui/catalog"));
const CartPage = lazy(() => import("@/modules/cart/pages/ui/cart"));
const BluetoothPage = lazy(
  () => import("@/modules/bluetooth/pages/ui/bluetooth"),
);
const UsbPage = lazy(() => import("@/modules/usb/pages/ui/usb"));

export const AppRoutes = () => {
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (location.pathname !== prevPathname) {
    NProgress.start();
    setPrevPathname(location.pathname);
  }

  useEffect(() => {
    NProgress.done();

    return () => {
      NProgress.done();
    };
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/bluetooth" element={<BluetoothPage />} />
      <Route path="/usb" element={<UsbPage />} />
    </Routes>
  );
};
