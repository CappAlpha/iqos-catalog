import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useEffect } from "react";
import type { Navigation } from "react-router";

NProgress.configure({
  showSpinner: false,
  speed: 350,
  trickleSpeed: 170,
  minimum: 0.05,
});

export const PageProgressBar = ({ state }: Pick<Navigation, "state">) => {
  useEffect(() => {
    if (state === "loading" || state === "submitting") {
      NProgress.start();
    } else {
      NProgress.done();
    }

    return () => {
      NProgress.done();
    };
  }, [state]);

  return null;
};
