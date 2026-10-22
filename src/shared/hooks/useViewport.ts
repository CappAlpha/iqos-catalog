import { useSyncExternalStore } from "react";

const breakpoints = {
  mobile: 390,
  mobileS: 540,
  mobileM: 768,
  tablet: 1024,
  desktopS: 1280,
  desktop: 1440,
  desktopL: 1600,
} as const;

type TViewport = {
  isMobile: boolean;
  isMobileS: boolean;
  isMobileM: boolean;
  isTablet: boolean;
  isDesktopS: boolean;
  isDesktop: boolean;
  isDesktopL: boolean;
};

type TBreakpoint = keyof typeof breakpoints;

const breakpointNames = Object.keys(breakpoints) as TBreakpoint[];
const listeners = new Set<() => void>();
const mediaQueries = new Map<TBreakpoint, MediaQueryList>();

const serverSnapshot: TViewport = {
  isMobile: false,
  isMobileS: false,
  isMobileM: false,
  isTablet: false,
  isDesktopS: false,
  isDesktop: false,
  isDesktopL: false,
};

let snapshot = serverSnapshot;

const getQuery = (breakpoint: TBreakpoint) =>
  `(max-width: ${breakpoints[breakpoint] - 0.02}px)`;

const initializeMediaQueries = () => {
  if (mediaQueries.size > 0) {
    return;
  }

  breakpointNames.forEach((breakpoint) => {
    mediaQueries.set(breakpoint, window.matchMedia(getQuery(breakpoint)));
  });
};

const readSnapshot = () => {
  const nextSnapshot = Object.fromEntries(
    breakpointNames.map((breakpoint) => [
      `is${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}`,
      mediaQueries.get(breakpoint)?.matches ?? false,
    ]),
  ) as TViewport;

  if (
    breakpointNames.every((breakpoint) => {
      const key =
        `is${breakpoint[0].toUpperCase()}${breakpoint.slice(1)}` as keyof TViewport;
      return snapshot[key] === nextSnapshot[key];
    })
  ) {
    return;
  }

  snapshot = nextSnapshot;
};

const updateSnapshot = () => {
  const previousSnapshot = snapshot;
  readSnapshot();

  if (snapshot !== previousSnapshot) {
    listeners.forEach((listener) => listener());
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== "undefined") {
    initializeMediaQueries();
    mediaQueries.forEach((mediaQuery) => {
      mediaQuery.addEventListener("change", updateSnapshot);
    });
    updateSnapshot();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      mediaQueries.forEach((mediaQuery) =>
        mediaQuery.removeEventListener("change", updateSnapshot),
      );
    }
  };
};

const getSnapshot = () => {
  if (listeners.size === 0 && typeof window !== "undefined") {
    initializeMediaQueries();
    readSnapshot();
  }

  return snapshot;
};
const getServerSnapshot = () => serverSnapshot;

export const useViewport = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
