import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  base: "/iqos-catalog/",
  plugins: [
    react(),
    svgr({ include: "**/*.svg" }),
    babel({
      babelConfig: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/app/styles/_mixins.scss" as *;`,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
