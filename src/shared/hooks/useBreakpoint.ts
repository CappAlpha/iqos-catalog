import { useSyncExternalStore, useMemo } from "react";

export const breakpoints = {
  mobile: 390,
  mobileS: 540,
  mobileM: 768,
  tablet: 1024,
  desktopS: 1280,
  desktop: 1440,
  desktopL: 1600,
} as const;

export type Breakpoint = keyof typeof breakpoints;
type BreakpointType = "max" | "min";

export const useMedia = (query: string, defaultState: boolean = false) => {
  const getServerSnapshot = () => defaultState;

  const [subscribe, getSnapshot] = useMemo(() => {
    return [
      (callback: () => void) => {
        const matchMedia = window.matchMedia(query);
        matchMedia.addEventListener("change", callback);
        return () => matchMedia.removeEventListener("change", callback);
      },
      () => window.matchMedia(query).matches,
    ];
  }, [query]);

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
};

export const useBreakpoint = (
  breakpoint: Breakpoint,
  type: BreakpointType = "min",
  defaultState: boolean = false
) => {
  const value = breakpoints[breakpoint];
  
  const adjustValue = type === "max" ? value - 0.02 : value;
  const query = `(${type}-width: ${adjustValue}px)`;

  return useMedia(query, defaultState);
};

export const useMobile = (def?: boolean) => useBreakpoint("mobile", "max", def);
export const useMobileS = (def?: boolean) => useBreakpoint("mobileS", "max", def);
export const useMobileM = (def?: boolean) => useBreakpoint("mobileM", "max", def);
export const useTablet = (def?: boolean) => useBreakpoint("tablet", "max", def);
export const useDesktopS = (def?: boolean) => useBreakpoint("desktopS", "max", def);
export const useDesktop = (def?: boolean) => useBreakpoint("desktop", "max", def);
export const useDesktopL = (def?: boolean) => useBreakpoint("desktopL", "max", def);