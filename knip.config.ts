import type { KnipConfig } from "knip";

export default {
  ignore: ["src/global.d.ts", "src/app/styles/**", "src/shared/hooks/**"],
  exclude: ["types"],
  ignoreDependencies: [
    "@capacitor/cli",
    "@capacitor/android",
    "@capacitor/ios",
  ],
} satisfies KnipConfig;
