import { execCommand } from "./base.ts";
import { writeFile } from "./files.ts";

export const createCron = async ({
  time,
  pathToFile,
}: {
  time: string;
  pathToFile: string;
}) => {
  const constructedLine = `${time} ${pathToFile}`;

  const tempFile = `/tmp/cron_${new Date().getTime().toString()}`;

  const { output: cronConfig } = await execCommand("crontab -l");
  let newCronConfig = cronConfig;

  if (cronConfig.includes(constructedLine)) {
    return;
  }
  if (cronConfig.includes(pathToFile)) {
    newCronConfig = cronConfig
      .split("\n")
      .filter((str) => !str.includes(pathToFile))
      .join("\n");
  }

  await writeFile(tempFile, newCronConfig);
  await execCommand(`crontab ${tempFile}`);
  await execCommand(`rm ${tempFile}`);
};
