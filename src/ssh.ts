import { execBySsh, execCommand } from "./base.ts";
import { join } from "path";
import type { Context } from "../dist/ramm.js";
import { debug } from "console";

const setupSshKeyUse = async (ip: string, pathToKey: string) => {
  const configFile = Bun.file("~/.ssh/config");
  if (!(await configFile.exists())) {
    await execCommand(`touch ~/.ssh/config`);
  }

  const configContent = await configFile.text();

  if (configContent.includes(ip)) {
    return;
  }
  const hostConfig = `
Host ${ip}
  IdentityFile ${pathToKey}
`;

  await execCommand(`\necho "${hostConfig}" >> ~/.ssh/config`);
};

async function createSshKey(
  name: string,
  pathToDir: string,
  comment: string = name
) {
  const keyPath = join(pathToDir, name);
  const keyPathPub = join(pathToDir, `${name}.pub`);
  const pubKeyRaw = Bun.file(keyPathPub);

  if (await pubKeyRaw.exists()) {
    return await pubKeyRaw.text();
  }

  await execCommand(`mkdir -p ${pathToDir}`);

  await execCommand(
    `ssh-keygen -t ed25519 -f ${keyPath} -N "" -C "${comment}"`
  );

  await execCommand(`chmod 600 ${keyPath}`);

  const pubKey = await Bun.file(keyPathPub).text();

  return pubKey;
}

const addSshKey = async (
  formatKey: string,
  pubKey: string,
  comment: string,
  context: Context
) => {
  const formant = `${formatKey} ${pubKey} ${comment}`;
  const { output: keys } = await execBySsh("cat .ssh/authorized_keys", context);
  if (keys.includes(formant)) {
    return;
  }

  await execBySsh(`echo "${formant}" >> .ssh/authorized_keys`, context);
};

export const createAndAddSshKey = async (
  name: string,
  pathToDir: string,
  comment: string,
  context: Context
) => {
  const key = await createSshKey(name, pathToDir, comment);

  debug(`Key is: ${key}`);

  await addSshKey("ed25519", key, comment, context);
};
