module.exports = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  tabWidth: 2,
  importOrder: [
    "^@/(.*)$",
    "^[./].*(?<!\\.module\\.scss)$",
    "^[./].*\\.module\\.scss$",
  ],
  importOrderSeparation: true,
  overrides: [
    {
      files: ["*.json", "*.md", "*.scss", "*.yml", "*.yaml"],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ["*.ts", "*.tsx"],
      options: {
        arrowParens: "always",
      },
    },
  ],
};
