import { copyFiles, exec } from "./base.ts";
import type { Context } from "./context.ts";

export const installBun = async (context: Context) => {
  const bunPath = new URL(import.meta.resolve("./bun.sh")).pathname;

  await copyFiles(bunPath, "./bun.sh", context);
  await exec("./bun.sh", context);
};
