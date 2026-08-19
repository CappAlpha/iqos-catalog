import { IS_CAPACITOR } from "./platform";

export const ROUTES = {
  CATALOG: "/",
  CART: "/cart",
  BLUETOOTH: "/bluetooth",
  USB: "/usb",
} as const;

export const ROUTER_BASENAME = IS_CAPACITOR ? "/" : "/iqos-catalog/";
