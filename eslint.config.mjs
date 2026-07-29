import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      // Output of a NEXT_DIST_DIR measurement build (see next.config.mjs).
      ".next-*/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "public/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
