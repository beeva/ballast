import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "next-env.d.ts",
      "coverage/**",
      ".ballast/**",
      "fixtures/**",
    ],
  },
  {
    rules: {
      // useActionState requires prevState as the first param whether or
      // not an action reads it - a leading underscore is the standard way
      // to mark "required by the API shape, intentionally unused," but
      // the default rule only auto-exempts an unused arg when a *later*
      // arg is used. testAlertWebhook has no formData param after
      // prevState, so it was the one action in this codebase actually
      // flagged - this exempts every `_`-prefixed arg consistently
      // instead of leaving that as a one-off inconsistency to trip over
      // again the next time an action doesn't need formData either.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
