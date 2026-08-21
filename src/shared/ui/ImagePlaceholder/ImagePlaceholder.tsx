import clsx from "clsx";

import s from "./ImagePlaceholder.module.scss";

interface IImagePlaceholderProps {
  className?: string;
  label?: string;
}

export const ImagePlaceholder = ({
  className,
  label = "Нет фото",
}: IImagePlaceholderProps) => {
  return (
    <div className={clsx(s.root, className)} role="img" aria-label={label}>
      <svg className={s.icon} viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="9" width="34" height="30" rx="4" />
        <circle cx="18" cy="19" r="3" />
        <path d="m11 34 9-9 6 6 4-4 7 7" />
      </svg>
      <span>{label}</span>
    </div>
  );
};
