import { execCommandMayError } from "./base/base.ts";
import { normalizeFileContent, writeFile } from "./files.ts";
import { normalizePath } from "./path.ts";

export const createCron = async ({
  time,
  pathToFile,
}: {
  time: string;
  pathToFile: string;
}) => {
  const pathToFileNorm = normalizePath(pathToFile);
  const constructedLine = `${time} ${pathToFileNorm}`;

  const tempFile = `/tmp/ramm_cron}`;

  const { stdout: cronConfig } = await execCommandMayError("crontab -l");
  let newCronConfig = cronConfig;

  if (cronConfig.includes(constructedLine)) {
    return;
  }
  if (cronConfig.includes(pathToFileNorm)) {
    newCronConfig = cronConfig
      .split("\n")
      .filter((str) => !str.includes(pathToFileNorm))
      .join("\n");
  }
  newCronConfig = normalizeFileContent(
    normalizeFileContent(cronConfig) + constructedLine
  );

  await writeFile(tempFile, newCronConfig);
  await execCommandMayError(`cat ${tempFile}`);
  await execCommandMayError(`crontab ${tempFile}`);
  await execCommandMayError(`rm ${tempFile}`);
};
