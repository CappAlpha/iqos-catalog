import { observer } from "mobx-react-lite";

import { preloadRoute } from "@/app/routes/routeConfig";
import { BluetoothIcon, CartIcon, CatalogIcon, USBIcon } from "@/assets/icons";
import { bluetoothM } from "@/modules/bluetooth/features/model/bluetoothM";
import { cartM } from "@/modules/cart/features/model/cartM";
import { usbM } from "@/modules/usb/features/model/usbM";
import { IS_IOS, ROUTES } from "@/shared/config";
import { useMobile, useMobileM } from "@/shared/hooks/useBreakpoint";
import { Header, type IHeaderLinkItem } from "@/shared/ui/Header";

export const AppHeader = observer(() => {
  const isMobile = useMobile();
  const isMobileM = useMobileM();

  const links: IHeaderLinkItem[] = [
    { to: ROUTES.CATALOG, text: "Каталог", Icon: CatalogIcon },
    {
      to: ROUTES.BLUETOOTH,
      text: "Bluetooth",
      Icon: BluetoothIcon,
      isConnected: bluetoothM.status === "connected",
    },
    {
      to: ROUTES.USB,
      text: "USB",
      Icon: USBIcon,
      isConnected: usbM.status === "connected",
    },
    {
      to: ROUTES.CART,
      text: "Корзина",
      Icon: CartIcon,
      badgeCount: cartM.uniqueItemsCount,
      isBadgeUpdating: cartM.isCartUpdating,
    },
  ].filter(({ to }) => !(to === ROUTES.USB && IS_IOS));

  const logoPlacement =
    IS_IOS || !isMobileM ? "outside" : isMobile ? "hidden" : "split";

  return (
    <Header
      links={links}
      logoTo={ROUTES.CATALOG}
      logoPlacement={logoPlacement}
      onPreloadRoute={preloadRoute}
    />
  );
});
