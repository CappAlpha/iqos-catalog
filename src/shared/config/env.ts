export const IQOS_ORIGIN =
  import.meta.env.VITE_IQOS_ORIGIN || "https://www.iqos.ru";

export const FEED_URL =
  import.meta.env.VITE_FEED_URL || `${IQOS_ORIGIN}/mindbox_feed.xml`;

const GITHUB_REPO =
  import.meta.env.VITE_GITHUB_REPO || "CappAlpha/iqos-catalog";

export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export const IS_DEV = import.meta.env.DEV;
