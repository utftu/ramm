import { build, file } from "bun";
import type { Context } from "./context.ts";
import { copyFilesBySsh, execBySsh, execCommand } from "./base.ts";
import { normalizePath } from "./path.ts";
import { writeFile } from "./files.ts";

export const buildAndRunOverSsh = async ({
  entrypoint,
  context,
}: {
  entrypoint: string;
  context: Context;
}) => {
  const normalizedEntrypoint = normalizePath(entrypoint);
  const distName = `ramm_dist`;
  const distDir = `/tmp/${distName}`;
  const outputs = await build({
    outdir: distDir,
    entrypoints: [normalizedEntrypoint],
    target: "bun",
  });

  const pathToDistFile = outputs.outputs[0]?.path!;
  const relativePathToFile = pathToDistFile.slice(distDir.length + 1);
  await copyFilesBySsh(`${distDir}/`, distDir, context);

  await execBySsh(`bun run ${distDir}/${relativePathToFile}`, context);
  await execCommand(`rm -rf ${distDir}`);
};

export const passVarsClient = async (
  data: Record<string, any>,
  context: Context
) => {
  const json = JSON.stringify(data);

  await writeFile("/tmp/ramm_json", json);

  await copyFilesBySsh("/tmp/ramm_json", "/tmp/ramm_json", context);

  await execCommand("rm -rf /tmp/ramm_json");
};

export const passVarsServer = async () => {
  const jsonData = await file("/tmp/ramm_json").json();

  await execCommand("rm -rf /tmp/ramm_json");
  return jsonData;
};
