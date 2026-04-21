import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type CSSOptions } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  base: "/iqos-catalog/",
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    svgr({ include: "**/*.svg" }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        additionalData: `@use "@/app/styles/_mixins.scss" as *;`,
      },
    },
  } as CSSOptions,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
