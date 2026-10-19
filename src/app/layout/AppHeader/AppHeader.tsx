import { observer } from "mobx-react-lite";

import { BluetoothIcon, CartIcon, CatalogIcon, USBIcon } from "@/assets/icons";
import { bluetoothM } from "@/modules/bluetooth/features/model/bluetoothM";
import { cartM } from "@/modules/cart/features/model/cartM";
import { usbM } from "@/modules/usb/features/model/usbM";
import { IS_ANDROID, IS_CAPACITOR, ROUTES } from "@/shared/config";
import { Header, type IHeaderLinkItem } from "@/shared/ui/Header";

export const AppHeader = observer(() => {
  const links: IHeaderLinkItem[] = [
    { to: ROUTES.CATALOG, text: "Каталог", Icon: CatalogIcon },
    {
      to: ROUTES.BLUETOOTH,
      text: "Bluetooth",
      Icon: BluetoothIcon,
      isConnected: bluetoothM.status === "connected",
      disabledReason: bluetoothM.isSupported
        ? undefined
        : IS_CAPACITOR
          ? "В приложении недоступен модуль Bluetooth."
          : "Браузер или текущая среда не поддерживает Web Bluetooth.",
    },
    {
      to: ROUTES.USB,
      text: "USB",
      Icon: USBIcon,
      isConnected: usbM.status === "connected",
      disabledReason: usbM.isSupported
        ? undefined
        : IS_CAPACITOR
          ? IS_ANDROID
            ? "В приложении не установлен модуль USB."
            : "USB-подключение недоступно в iOS-приложении."
          : "Браузер или текущая среда не поддерживает Web USB.",
    },
    {
      to: ROUTES.CART,
      text: "Корзина",
      Icon: CartIcon,
      badgeCount: cartM.uniqueItemsCount,
      isBadgeUpdating: cartM.isCartUpdating,
    },
  ];

  return <Header links={links} logoTo={ROUTES.CATALOG} />;
});
