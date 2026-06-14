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
}
