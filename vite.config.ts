import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type CSSOptions } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: mode === "capacitor" ? "./" : "/iqos-catalog/",
    plugins: [
      react({ compiler: true }),
      svgr(),
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
      target: "es2022",
      minify: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "vendor-react",
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 20,
              },
              {
                name: "vendor-router",
                test: /node_modules[\\/]react-router/,
                priority: 15,
              },
              {
                name: "vendor-state",
                test: /node_modules[\\/](mobx|@tanstack)/,
                priority: 10,
              },
              {
                name: "vendor-utils",
                test: /node_modules[\\/](axios|sonner)/,
                priority: 5,
              },
            ],
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
            return `[name]-[hash][extname]`;
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
