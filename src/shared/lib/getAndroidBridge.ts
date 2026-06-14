import { registerPlugin } from "@capacitor/core";

import { IS_ANDROID } from "../constants/constants";
import type { IAndroidBridgePlugin } from "../types/types";

export const AndroidBridge = IS_ANDROID
  ? registerPlugin<IAndroidBridgePlugin>("AndroidBridge")
  : null;
