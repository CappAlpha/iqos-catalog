import type { KnipConfig } from "knip";

export default {
  ignore: [
    "src/global.d.ts",
    "src/app/styles/**",
    "src/shared/hooks/useBreakpoint.ts",
  ],
  exclude: ["types"],
  ignoreDependencies: ["zod-validation-error"],
} satisfies KnipConfig;
