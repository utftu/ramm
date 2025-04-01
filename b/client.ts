import { build } from "bun";

const a = await build({
  // outdir: "./run/dist",
  entrypoints: ["./b/server.ts"],
});

console.log("-----", "a", a);
