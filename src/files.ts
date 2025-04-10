import { appendFile, exists, stat } from "node:fs/promises";
import { execCommand } from "./base.ts";

const finalizeWithNewline = (str: string) => {
  if (str.at(-1) !== "\n") {
    return str + "\n";
  }

  return str;
};

const createDir = async (str: string) => {
  const dirname = str.split("/").slice(0, -1).join("/");

  const exist = await exists(dirname);

  if (exist) {
    return;
  }

  await execCommand(`mkdir -p ${dirname}`);
};

const checkStrInFile = async (filePath: string, str: string) => {
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return false;
  }

  const fileText = await file.text();

  if (fileText.includes(str)) {
    return true;
  }

  return false;
};

export const writeIfNew = async (filePath: string, str: string) => {
  await createDir(filePath);

  if (await checkStrInFile(filePath, str)) {
    return;
  }

  if (!(await Bun.file(filePath).exists())) {
    await execCommand(`touch ${filePath}`);
  }

  await appendFile(filePath, finalizeWithNewline(str));
};
