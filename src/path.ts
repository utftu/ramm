import { homedir } from "node:os";
import { join } from "node:path";

export function normalizePath(rawFilePath: string) {
  let finalFilePath = rawFilePath.trim();

  if (finalFilePath.startsWith("~/")) {
    finalFilePath = join(homedir(), finalFilePath.slice(2));
  }

  return finalFilePath;
}
