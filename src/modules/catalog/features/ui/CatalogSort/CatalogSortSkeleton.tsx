import clsx from "clsx";

import s from "./CatalogSort.module.scss";

interface IProps {
  compact?: boolean;
}

export const CatalogSortSkeleton = ({ compact = false }: IProps) => (
  <div
    className={clsx(s.rootSkeleton, compact && s.compactSkeleton)}
    aria-hidden="true"
  />
);
