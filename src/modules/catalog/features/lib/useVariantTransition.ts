import { useState, useTransition } from "react";

import { preloadImage } from "@/shared/lib/preloadImage";

import type { ProductGroup } from "../model/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useVariantTransition = (variants: ProductGroup["variants"]) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (idx: number) => {
    if (idx === selectedIdx) return;

    startTransition(async () => {
      const newUrl = variants[idx].pictureUrl;
      const currentUrl = variants[selectedIdx].pictureUrl;

      await Promise.all([
        delay(400),
        newUrl && newUrl !== currentUrl
          ? preloadImage(newUrl)
          : Promise.resolve(),
      ]);

      setSelectedIdx(idx);
    });
  };

  return { selectedIdx, isPending, handleSelect };
};
