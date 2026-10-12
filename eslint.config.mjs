import { defineConfig } from "eslint/config";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  defineConfig([
    {
      ignores: [".nuxt/**", ".output/**", "out/**", "build/**", "test/*.cjs", "node_modules/**"],
    },
    {
      rules: {
        "@typescript-eslint/unified-signatures": "off",
        "vue/no-v-html": "off",
      },
    },
  ]),
);
