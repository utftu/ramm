import { appendFile, exists, stat } from "node:fs/promises";
import { execCommand } from "./base.ts";
import { file, write } from "bun";
import { normalizePath } from "./path.ts";

export const normalizeFileContent = (str: string) => {
  if (str === "") {
    return str;
  }

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

const createFileIfNeed = async (rawFilePath: string) => {
  const filePath = normalizePath(rawFilePath);
  await createDir(filePath);

  if (!(await Bun.file(filePath).exists())) {
    await execCommand(`touch ${filePath}`);
  }
};

export const writeIfNew = async (rawFilePath: string, str: string) => {
  const filePath = normalizePath(rawFilePath);
  await createFileIfNeed(filePath);

  if (await checkStrInFile(filePath, str)) {
    return;
  }

  await appendFile(filePath, normalizeFileContent(str));
};

export const writeFile = async (pathToFile: string, str: string) => {
  const normalizedPath = normalizePath(pathToFile);
  await createFileIfNeed(normalizedPath);

  await write(normalizedPath, str);
};

export const writeFileIfNotMatch = async (pathToFile: string, str: string) => {
  const normalizedPath = normalizePath(pathToFile);
  await createFileIfNeed(normalizedPath);

  const fileText = await file(normalizedPath).text();

  if (fileText === str) {
    return;
  }

  await write(normalizedPath, str);
};
