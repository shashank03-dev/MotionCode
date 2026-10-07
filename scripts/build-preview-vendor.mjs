/**
 * Rebuilds the self-hosted runtime the Studio preview iframe loads from
 * /vendor. The preview runs inside a srcdoc iframe, which inherits the app's
 * Content-Security-Policy (`script-src 'self'`), so every library it needs has
 * to be served from our own origin rather than a CDN.
 *
 * Usage: node scripts/build-preview-vendor.mjs
 * Re-run after bumping react, react-dom, framer-motion, @react-spring/web,
 * sucrase or gsap, then commit the regenerated files in public/vendor.
 */
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// rolldown ships with vite (via @vitejs/plugin-react / vitest).
import { build } from "rolldown";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "vendor");
const nodeModules = path.join(root, "node_modules");

const copies = [
  ["react/umd/react.production.min.js", "react.production.min.js"],
  ["react-dom/umd/react-dom.production.min.js", "react-dom.production.min.js"],
  // UMD build; exposes the `Motion` global and reads the `React` global.
  ["framer-motion/dist/framer-motion.js", "framer-motion.js"],
  ["gsap/dist/gsap.min.js", "gsap.min.js"],
];

const bundles = [
  {
    // @react-spring/web ships no UMD build, so wrap it as an IIFE that reads
    // the React/ReactDOM globals provided by the UMD files above.
    file: "react-spring-web.js",
    name: "ReactSpring",
    source: 'export * from "@react-spring/web";',
  },
  {
    // Transpiles generated TS/JSX/ESM inside the iframe (replaces a 3MB
    // @babel/standalone download from a CDN).
    file: "sucrase.js",
    name: "Sucrase",
    source: 'export { transform } from "sucrase";',
  },
];

await mkdir(outDir, { recursive: true });

for (const [from, to] of copies) {
  await copyFile(path.join(nodeModules, from), path.join(outDir, to));
  console.log(`copied ${from} -> public/vendor/${to}`);
}

const tmpDir = path.join(nodeModules, ".cache", "preview-vendor");
await mkdir(tmpDir, { recursive: true });

for (const bundle of bundles) {
  const entry = path.join(tmpDir, `${bundle.name}.mjs`);
  await writeFile(entry, `${bundle.source}\n`);
  await build({
    input: entry,
    cwd: root,
    external: ["react", "react-dom"],
    platform: "browser",
    transform: { define: { "process.env.NODE_ENV": '"production"' } },
    output: {
      file: path.join(outDir, bundle.file),
      format: "iife",
      name: bundle.name,
      globals: { react: "React", "react-dom": "ReactDOM" },
      minify: true,
    },
  });
  console.log(`bundled ${bundle.file}`);
}

await rm(tmpDir, { recursive: true, force: true });
