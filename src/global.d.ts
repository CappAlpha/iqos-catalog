import type { CapacitorGlobal } from "@capacitor/core";
import type { FunctionComponent, SVGProps } from "react";

export {};

declare global {
  type TIconType = FunctionComponent<
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

  interface ImportMetaEnv {
    readonly VITE_IQOS_ORIGIN?: string;
    readonly VITE_FEED_URL?: string;
    readonly VITE_GITHUB_REPO?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
