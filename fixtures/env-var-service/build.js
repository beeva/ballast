console.log("env-var-service: starting build");

if (!process.env.CONFIG_TOKEN) {
  console.error("env-var-service: missing required CONFIG_TOKEN");
  process.exit(1);
}

console.log(`env-var-service: CONFIG_TOKEN=${process.env.CONFIG_TOKEN}`);
console.log("env-var-service: build complete");
