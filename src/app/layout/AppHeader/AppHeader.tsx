import { observer } from "mobx-react-lite";

import { BluetoothIcon, CartIcon, CatalogIcon, USBIcon } from "@/assets/icons";
import { bluetoothM } from "@/modules/bluetooth/features/model/bluetoothM";
import { cartM } from "@/modules/cart/features/model/cartM";
import { usbM } from "@/modules/usb/features/model/usbM";
import { BLUETOOTH_SUPPORT, ROUTES, USB_SUPPORT } from "@/shared/config";
import type { TDeviceUnavailableReason } from "@/shared/config/types";
import { Header, type IHeaderLinkItem } from "@/shared/ui/Header";

const BLUETOOTH_UNAVAILABLE_MESSAGES: Record<TDeviceUnavailableReason, string> =
  {
    "native-platform-unsupported":
      "Bluetooth-подключение недоступно на этой платформе.",
    "native-plugin-unavailable": "В приложении недоступен модуль Bluetooth.",
    "web-api-unavailable":
      "Браузер или текущая среда не поддерживает Web Bluetooth.",
  };

const USB_UNAVAILABLE_MESSAGES: Record<TDeviceUnavailableReason, string> = {
  "native-platform-unsupported":
    "USB-подключение доступно только в Android-приложении.",
  "native-plugin-unavailable": "В приложении не установлен модуль USB.",
  "web-api-unavailable": "Браузер или текущая среда не поддерживает Web USB.",
};

export const AppHeader = observer(() => {
  const links: IHeaderLinkItem[] = [
    { to: ROUTES.CATALOG, text: "Каталог", Icon: CatalogIcon },
    {
      to: ROUTES.BLUETOOTH,
      text: "Bluetooth",
      Icon: BluetoothIcon,
      isConnected: bluetoothM.status === "connected",
      disabledReason:
        BLUETOOTH_SUPPORT.unavailableReason === null
          ? undefined
          : BLUETOOTH_UNAVAILABLE_MESSAGES[BLUETOOTH_SUPPORT.unavailableReason],
    },
    {
      to: ROUTES.USB,
      text: "USB",
      Icon: USBIcon,
      isConnected: usbM.status === "connected",
      disabledReason:
        USB_SUPPORT.unavailableReason === null
          ? undefined
          : USB_UNAVAILABLE_MESSAGES[USB_SUPPORT.unavailableReason],
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
