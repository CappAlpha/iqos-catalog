import clsx from "clsx";

import s from "./PageLoader.module.scss";

interface PageLoaderProps {
  hasOverlay?: boolean;
  className?: string;
}

export const PageLoader = ({
  hasOverlay = false,
  className,
}: Readonly<PageLoaderProps>) => {
  return (
    <div className={clsx(s.root, hasOverlay && s.overlay, className)}>
      <div className={s.loader} />
    </div>
  );
};
