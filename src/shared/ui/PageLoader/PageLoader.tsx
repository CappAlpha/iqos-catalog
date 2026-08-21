import clsx from "clsx";

import s from "./PageLoader.module.scss";

interface IPageLoaderProps {
  hasOverlay?: boolean;
  className?: string;
}

export const PageLoader = ({
  hasOverlay = false,
  className,
}: Readonly<IPageLoaderProps>) => {
  return (
    <div className={clsx(s.root, hasOverlay && s.overlay, className)}>
      <div className={s.loader} />
    </div>
  );
};
