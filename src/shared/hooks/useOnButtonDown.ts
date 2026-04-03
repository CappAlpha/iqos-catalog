import { useEffect, useRef } from "react";

export const useOnButtonDown = (
  key: KeyboardEvent["key"],
  onButtonDown: (e?: KeyboardEvent) => void,
  disabled?: boolean,
) => {
  const callbackRef = useRef(onButtonDown);

  useEffect(() => {
    callbackRef.current = onButtonDown;
  }, [onButtonDown]);

  useEffect(() => {
    if (disabled) return;

    const handleButton = (e: KeyboardEvent) => {
      if (e.key === key) {
        callbackRef.current(e);
      }
    };

    document.addEventListener("keydown", handleButton);
    return () => document.removeEventListener("keydown", handleButton);
  }, [key, disabled]);
};
