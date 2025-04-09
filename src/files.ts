import { appendFile } from "node:fs/promises";

const finalizeWithNewline = (str: string) => {
  if (str.at(-1) !== "\n") {
    return str + "\n";
  }

  return str;
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
  if (await checkStrInFile(filePath, str)) {
    return;
  }

  await appendFile(filePath, finalizeWithNewline(str));
};
