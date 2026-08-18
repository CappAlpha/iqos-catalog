import type { KnipConfig } from "knip";

export default {
  ignore: ["src/app/styles/**", "src/shared/hooks/useBreakpoint.ts"],
  exclude: ["types"],
  ignoreDependencies: [],
} satisfies KnipConfig;
