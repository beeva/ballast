// A deliberately tiny, real build step - no framework, no bundler - so
// Ballast's build runner has something genuine to execute and capture
// output from without depending on npm install completing successfully
// (this fixture has zero dependencies on purpose).
const fs = require("node:fs");
const path = require("node:path");

console.log("sample-service: starting build");

const distDir = path.join(__dirname, "dist");
fs.mkdirSync(distDir, { recursive: true });

const output = {
  builtAt: new Date().toISOString(),
  message: "Hello from sample-service",
};
fs.writeFileSync(path.join(distDir, "output.json"), JSON.stringify(output, null, 2));

console.log(`sample-service: wrote dist/output.json`);
console.log("sample-service: build complete");
