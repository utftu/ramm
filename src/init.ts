import { copyFilesBySsh, execCommandOverSsh } from "./base/base.ts";
import type { Context } from "./context.ts";

export const installBun = async (context: Context) => {
  const bunPath = new URL(import.meta.resolve("./bun.sh")).pathname;

  await copyFilesBySsh(bunPath, "./bun.sh", context);
  await execCommandOverSsh("./bun.sh", context);
};
