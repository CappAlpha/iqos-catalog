import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type CSSOptions } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: mode === "capacitor" ? "./" : "/iqos-catalog/",
    plugins: [
      react(),
      svgr(),
      babel({
        presets: [reactCompilerPreset()],
        include: /\.(jsx|tsx|js|ts)$/,
        exclude: /node_modules/,
      }),
      visualizer({ open: true, filename: "bundle-stats.html" }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          additionalData: `
            @use "@/app/styles/_mixins.scss" as *;
            @use "@/app/styles/animations.scss" as *;
        `,
        },
      },
    } as CSSOptions,
    build: {
      target: "es2020",
      minify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")
            ) {
              return "vendor-react";
            }

            if (id.includes("node_modules/react-router")) {
              return "vendor-router";
            }

            if (
              id.includes("node_modules/mobx") ||
              id.includes("node_modules/@tanstack")
            ) {
              return "vendor-state";
            }

            if (
              id.includes("node_modules/@capacitor") ||
              id.includes("node_modules/@capawesome")
            ) {
              return "vendor-capacitor";
            }

            if (
              id.includes("node_modules/axios") ||
              id.includes("node_modules/dompurify") ||
              id.includes("node_modules/sonner")
            ) {
              return "vendor-utils";
            }
          },
          assetFileNames: (assetInfo) => {
            const assetName = assetInfo.names?.[0] ?? "";

            const isImage = /\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(
              assetName,
            );
            const isFont = /\.(woff|woff2|eot|ttf|otf)$/i.test(assetName);

            if (isImage) {
              return `img/[name][extname]`;
            }
            if (isFont) {
              return `fonts/[name][extname]`;
            }
            return `[name][extname]`;
          },
          entryFileNames: "[name]-[hash].js",
          chunkFileNames: "[name]-[hash].js",
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
