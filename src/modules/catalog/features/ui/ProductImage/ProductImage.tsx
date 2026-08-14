import cn from "classnames";
import { useEffect, useRef, useState } from "react";

import { getColorHex } from "../../lib/getColorHex";
import type { ProductGroup } from "../../model/types";

import s from "./ProductImage.module.scss";

interface ProductImageProps {
  src: string | null;
  alt: string;
  type: ProductGroup["type"];
  variantLabel: string;
  className: string;
  placeholderClassName: string;
  loading?: "eager" | "lazy";
  isFallback: boolean;
  onError: () => void;
}

const ProductPlaceholder = ({
  type,
  variantLabel,
  className,
}: Pick<ProductImageProps, "type" | "variantLabel"> & {
  className: string;
}) => {
  const accentColor = type === "color" ? getColorHex(variantLabel) : "#5d6268";
  const isBlock =
    type === "size" && variantLabel.toLowerCase().includes("блок");
  const placeholderLabel = isBlock
    ? "Пример блока стиков"
    : type === "size"
      ? "Пример пачки стиков"
      : "Пример устройства";

  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      role="img"
      aria-label={placeholderLabel}
      style={{ color: accentColor }}
    >
      {isBlock ? (
        <g transform="translate(32 64)">
          <rect
            x="2"
            y="2"
            width="174"
            height="108"
            rx="14"
            fill="currentColor"
            fillOpacity="0.72"
            stroke="#3f454b"
            strokeWidth="5"
          />
          <path
            d="M18 31h142M18 45h142M28 70v27M48 70v27M68 70v27M88 70v27M108 70v27M128 70v27M18 84h142"
            stroke="#fff"
            strokeOpacity="0.78"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ) : type === "size" ? (
        <g transform="translate(72 28)">
          <g transform="translate(48 0) scale(1.15 1) translate(-48 0)">
            <rect
              x="8"
              width="80"
              height="184"
              rx="18"
              fill="currentColor"
              fillOpacity="0.75"
              stroke="#3f454b"
              strokeWidth="5"
            />
            <path
              d="M25 42h46M25 56h46"
              stroke="#3f454b"
              strokeOpacity="0.65"
              strokeWidth="4"
            />
            <path
              d="M30 91v54M42 91v54M54 91v54M66 91v54"
              stroke="#3f454b"
              strokeOpacity="0.65"
              strokeWidth="5"
            />
          </g>
        </g>
      ) : (
        <g transform="translate(72 20) rotate(-8 48 100)">
          <g transform="translate(48 100) scale(0.765 0.85) translate(-48 -100)">
            <rect
              x="12"
              width="72"
              height="200"
              rx="28"
              fill="currentColor"
              fillOpacity="0.75"
              stroke="#3f454b"
              strokeWidth="5"
            />
            <rect
              x="20"
              y="15"
              width="56"
              height="180"
              rx="21"
              fill="none"
              stroke="#3f454b"
              strokeOpacity="0.45"
              strokeWidth="2"
            />
            <rect
              x="28"
              y="42"
              width="40"
              height="72"
              rx="18"
              fill="#3f454b"
              fillOpacity="0.12"
              stroke="#3f454b"
              strokeOpacity="0.35"
              strokeWidth="2"
            />
            <rect x="37" y="57" width="22" height="7" rx="3.5" fill="#3f454b" />
            <circle cx="48" cy="88" r="11" fill="#3f454b" />
            <rect
              x="34"
              y="145"
              width="28"
              height="7"
              rx="3.5"
              fill="#3f454b"
              fillOpacity="0.45"
            />
            <path d="M84 70c7 0 11 5 11 12v26c0 7-4 12-11 12" fill="#25232d" />
          </g>
        </g>
      )}
    </svg>
  );
};

export const ProductImage = ({
  src,
  alt,
  type,
  variantLabel,
  className,
  placeholderClassName,
  loading,
  isFallback,
  onError,
}: ProductImageProps) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadTimerRef = useRef<number | null>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsLoaded(false);
  }

  useEffect(() => {
    return () => {
      if (loadTimerRef.current !== null) {
        window.clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, [src]);

  if (!src || isFallback) {
    return (
      <ProductPlaceholder
        type={type}
        variantLabel={variantLabel}
        className={placeholderClassName}
      />
    );
  }

  const handleLoad = () => {
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current);
    }

    loadTimerRef.current = window.setTimeout(() => {
      setIsLoaded(true);
      loadTimerRef.current = null;
    }, 400);
  };

  return (
    <>
      {!isLoaded && <div className={cn(className, s.skeleton)} />}
      <img
        className={cn(className, s.image, isLoaded && s.imageLoaded)}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={onError}
      />
    </>
  );
};
