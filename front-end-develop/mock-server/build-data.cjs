// Bundles mock-data-entry.ts (which re-exports src/mocks/**) into a single
// CommonJS file the plain-Node mock server can require() without a TS loader.
const path = require("path");
const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: [path.join(__dirname, "mock-data-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: path.join(__dirname, ".generated", "mock-data.cjs"),
  logLevel: "info",
});
