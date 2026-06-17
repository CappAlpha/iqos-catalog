import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
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
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          additionalData: `@use "@/app/styles/_mixins.scss" as *;`,
        },
      },
    } as CSSOptions,
    build: {
      target: "es2020",
      minify: true,
      rollupOptions: {
        output: {
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
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
