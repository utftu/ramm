import { execBySsh, execCommand } from "./base/base.ts";
import type { Context } from "./context.ts";
import { debug } from "console";
import { writeIfNewCompletely, writeIfNew } from "./files.ts";
import { debugApiCall } from "./debug.ts";
import { file } from "bun";

export const addKeyToHostConfig = async (
  pathToHost: string,
  address: string,
  pathToKey: string
) => {
  const text = `Host ${address}
  IdentityFile ${pathToKey}
`;

  await writeIfNew(pathToHost, text);
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

  const pathToKeyFile = file(pathToKey);
  const pathToKeyPubFile = file(pathToKeyPub);

  debugApiCall(`file(${pathToKey}).exist()`);
  debugApiCall(`file(${pathToKeyPub}).exist()`);
  if ((await pathToKeyFile.exists()) && (await pathToKeyPubFile.exists())) {
    return await pathToKeyPubFile.text();
  }

  await execCommand(`mkdir -p ${pathToDir}`);

  await execCommand(
    `ssh-keygen -t ed25519 -f ${pathToKey} -N "" -C "${comment || name}"`
  );

  await execCommand(`chmod 600 ${pathToKey}`);

  debugApiCall(`file(${pathToKeyPub}).text()`);
  const pubKey = await Bun.file(pathToKeyPub).text();

  return pubKey;
}

const addSshKeyToAuthorized = async (pubKey: string, context: Context) => {
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

  await addSshKeyToAuthorized(pubKey, context);
};

export const setupSshKey = async ({
  key,
  fingerprint,
  pathToFile,
  server,
}: {
  key: string;
  fingerprint: string;
  pathToFile: string;
  server: string;
}) => {
  await writeIfNewCompletely(pathToFile, key);
  await execCommand(`chmod 0600 ${pathToFile}`);
  await writeIfNew("~/.ssh/known_hosts", fingerprint);
  await addKeyToHostConfig("~/.ssh/config", server, pathToFile);
};
