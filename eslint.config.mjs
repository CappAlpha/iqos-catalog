import reactPlugin from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import pluginMobx from "eslint-plugin-mobx";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "android/**", "ios/**"],
  },

  // base js
  js.configs.recommended,

  // ts
  ...tsEslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),

  // plugins
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@eslint-react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
      mobx: pluginMobx,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      
      ...reactHooksPlugin.configs.recommended.rules,

      ...reactRefreshPlugin.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      ...pluginMobx.configs.recommended.rules,
      "mobx/exhaustive-make-observable": "warn",
      "mobx/unconditional-make-observable": "error",
      "mobx/missing-make-observable": "error",
      "mobx/missing-observer": "off",

      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
    },
  },

  // globals
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["*.config.{ts,mjs}", "eslint.config.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  prettierConfig,
];
