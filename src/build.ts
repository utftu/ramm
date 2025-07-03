import { build, file } from "bun";
import type { Context } from "./context.ts";
import { copyFilesBySsh, execBySsh, execCommand } from "./base/base.ts";
import { normalizePath } from "./path.ts";
import { writeFile } from "./files.ts";
import { printFunction } from "./print.ts";

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

const pathToJson = "/tmp/ramm_json";
export const passVarsClient = async (
  data: Record<string, any>,
  context: Context
) => {
  printFunction("passVarsClient");
  const json = JSON.stringify(data);

  await writeFile(pathToJson, json);

  await copyFilesBySsh(pathToJson, pathToJson, context);

  await execCommand(`rm -rf ${pathToJson}`);
};

export const passVarsServer = async () => {
  printFunction("passVarsServer");
  const jsonData = await file(pathToJson).json();

  await execCommand(`rm -rf ${pathToJson}`);
  return jsonData;
};
