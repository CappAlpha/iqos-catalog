import { useState, useTransition } from "react";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useVariantTransition = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (idx: number) => {
    if (idx === selectedIdx) return;

    startTransition(async () => {
      await Promise.all([delay(400), Promise.resolve()]);

      setSelectedIdx(idx);
    });
  };

  return { selectedIdx, isPending, handleSelect };
};
