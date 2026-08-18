import { BProgress } from "@bprogress/core";
import { useEffect } from "react";
import type { Navigation } from "react-router";

BProgress.configure({
  showSpinner: false,
  speed: 350,
  trickleSpeed: 150,
  minimum: 0.05,
});

export const PageProgressBar = ({ state }: Pick<Navigation, "state">) => {
  useEffect(() => {
    if (state === "loading" || state === "submitting") {
      BProgress.start();
    } else {
      BProgress.done();
    }

    return () => {
      BProgress.done();
    };
  }, [state]);

  return null;
};
