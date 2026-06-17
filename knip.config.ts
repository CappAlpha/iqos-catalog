import type { KnipConfig } from "knip";

export default {
  ignore: ["src/global.d.ts", "src/app/styles/**", "src/shared/hooks/**"],
  exclude: ["types"],
  ignoreDependencies: ["@capacitor/ios", "zod-validation-error"],
} satisfies KnipConfig;
