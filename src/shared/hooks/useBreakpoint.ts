import { useEffect, useState } from "react";

export const useMedia = (query: string, defaultState: boolean = false) => {
  const getInitialState = (): boolean => {
    if (typeof globalThis.window === "undefined" || !globalThis.window.matchMedia) {
      return defaultState;
    }
    return globalThis.window.matchMedia(query).matches;
  };

  const [state, setState] = useState(getInitialState);

  useEffect(() => {
    if (typeof globalThis.window === "undefined" || !globalThis.window.matchMedia) {
      return;
    }

    const mql = globalThis.window.matchMedia(query);

    const onChange = (event: MediaQueryListEvent) => {
      setState(event.matches);
    };

    mql.addEventListener("change", onChange);

    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, [query]);

  return state;
};

type Breakpoint =
  | "mobile"
  | "mobileM"
  | "tablet"
  | "desktopS"
  | "desktop"
  | "desktopL";

type BreakpointType = "max" | "min";

// If change it there, also change in _mixins.scss
export const breakpoints: Record<Breakpoint, number> = {
  mobile: 390,
  mobileM: 768,
  tablet: 1024,
  desktopS: 1280,
  desktop: 1440,
  desktopL: 1600,
};

export const useBreakpoint = (
  breakpoint: Breakpoint,
  type: BreakpointType = "min",
  defaultState: boolean = false
) => {
  const value = breakpoints[breakpoint];
  const query = `(${type}-width: ${value}px)`;

  return useMedia(query, defaultState);
};

export const useMobile = (defaultState?: boolean) =>
  useBreakpoint("mobile", "max", defaultState);
export const useMobileM = (defaultState?: boolean) =>
  useBreakpoint("mobileM", "max", defaultState);
export const useTablet = (defaultState?: boolean) =>
  useBreakpoint("tablet", "max", defaultState);
export const useDesktopS = (defaultState?: boolean) =>
  useBreakpoint("desktopS", "min", defaultState);
export const useDesktop = (defaultState?: boolean) =>
  useBreakpoint("desktop", "min", defaultState);
export const useDesktopL = (defaultState?: boolean) =>
  useBreakpoint("desktopL", "min", defaultState);