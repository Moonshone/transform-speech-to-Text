import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    // Next's server build adds the `node` export condition, even while it
    // analyzes a client-side Web Worker. Transformers.js would therefore
    // resolve to transformers.node.mjs, which imports native-only modules such
    // as `sharp`. This worker must always use the browser distribution.
    config.resolve.alias["@huggingface/transformers$"] = path.resolve(
      process.cwd(),
      "node_modules/@huggingface/transformers/dist/transformers.web.js",
    );

    if (!dev) {
      // onnxruntime-web ships this file already minified and as an ES module.
      // Running it through Next's Terser pass a second time makes Terser parse
      // it as a classic script, where `import.meta` is invalid. Keep the
      // vendor-provided asset untouched; our own application chunks are still
      // minified normally.
      const ortBundle = /(?:^|\/)ort\.bundle\.min(?:\.[\w-]+)?\.mjs$/;
      for (const minimizer of config.optimization?.minimizer ?? []) {
        if (minimizer?.constructor?.name !== "TerserPlugin") continue;
        const currentExclude = minimizer.options.exclude;
        minimizer.options.exclude = currentExclude
          ? [currentExclude, ortBundle]
          : ortBundle;
      }
    }
    return config;
  },
};

export default nextConfig;
