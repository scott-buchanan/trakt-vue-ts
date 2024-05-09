import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import eslintParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/*", "*.config.*", "shims*", "*.json"],
  },
  {
    languageOptions: {
      globals: globals.browser,
      parser: eslintParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        // sourceType: 'module',
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
];
