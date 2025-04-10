import { execBySsh, execCommand } from "./base.ts";
import type { Context } from "./context.ts";
import { debug } from "console";
import { writeIfNew } from "./files.ts";

// const setupSshKeyUse = async (ip: string, pathToKey: string) => {
//   const configFile = Bun.file("~/.ssh/config");
//   if (!(await configFile.exists())) {
//     await execCommand(`touch ~/.ssh/config`);
//   }

//   const configContent = await configFile.text();

//   if (configContent.includes(ip)) {
//     return;
//   }
//   const hostConfig = `
// Host ${ip}
//   IdentityFile ${pathToKey}
// `;

//   await execCommand(`\necho "${hostConfig}" >> ~/.ssh/config`);
// };

export const addKeyToHostConfig = async (
  address: string,
  pathToKey: string
) => {
  const text = `Host ${address}
  IdentityFile ${pathToKey}
`;

  await writeIfNew(pathToKey, text);
};

export const getServerFingerprintBySsh = async (context: Context) => {
  const { output } = await execBySsh(
    'ssh-keyscan -t ed25519 localhost | grep -v "^#"',
    context
  );
  return output.replace("localhost", context.domain);
};

async function createSshKey(pathToKey: string, comment?: string) {
  const name = pathToKey.split("/").at(-1);
  const pathToKeyPub = `${pathToKey}.pub`;
  const pathToDir = pathToKey.split("/").slice(0, -1).join("/");

  const pathToKeyFile = Bun.file(pathToKey);
  const pathToKeyPubFile = Bun.file(pathToKeyPub);

  if ((await pathToKeyFile.exists()) && (await pathToKeyPubFile.exists())) {
    return await pathToKeyPubFile.text();
  }

  await execCommand(`mkdir -p ${pathToDir}`);

  await execCommand(
    `ssh-keygen -t ed25519 -f ${pathToKey} -N "" -C "${comment || name}"`
  );

  await execCommand(`chmod 600 ${pathToKey}`);

  const pubKey = await Bun.file(pathToKeyPub).text();

  return pubKey;
}

const addSshKey = async (pubKey: string, context: Context) => {
  const { output: keys } = await execBySsh("cat .ssh/authorized_keys", context);
  if (keys.includes(pubKey)) {
    return;
  }

  await execBySsh(`echo "${pubKey}" >> .ssh/authorized_keys`, context);
};

export const createAndAddSshKey = async (
  pathToKey: string,
  comment: string,
  context: Context
) => {
  const pubKey = await createSshKey(pathToKey, comment);

  debug(`Key is: ${pubKey}`);

  await addSshKey(pubKey, context);
};
