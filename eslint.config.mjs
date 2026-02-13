// eslint.config.mjs
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  {
    ignores: [
      "node_modules/**",
    ],
  },

  {
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
    },
  },

  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.d.ts"],
    ...tsEslint.configs.disableTypeChecked,
  },

  js.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
);
