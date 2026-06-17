export default {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  tabWidth: 2,
  trailingComma: "all",
  importOrder: [
    "^@/(.*)$",
    "^[./].*(?<!\\.module\\.scss)$",
    "^[./].*\\.module\\.scss$",
  ],
  importOrderSeparation: true,
  overrides: [
    {
      files: ["*.json", "*.md", "*.scss", "*.yml", "*.yaml"],
    },
    {
      files: ["*.ts", "*.tsx"],
      options: {
        arrowParens: "always",
      },
    },
  ],
};
