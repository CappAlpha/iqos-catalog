import type { CapacitorGlobal } from "@capacitor/core";
import type { FunctionComponent, SVGProps } from "react";

export {};

declare global {
  type IconType = FunctionComponent<
    SVGProps<SVGSVGElement> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;

  interface Window {
    Capacitor?: CapacitorGlobal;
  }
}
