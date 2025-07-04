import { execCommand, execCommandOverSsh } from "./base/base.ts";
import type { Context } from "./context.ts";
import { writeIfNewCompletely, writeIfNew } from "./files.ts";
import { file } from "bun";
import { printFunction } from "./print.ts";
import { normalizePath } from "./path.ts";

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

export const getServerFingerprintOverSsh = async (context: Context) => {
  const { stdout } = await execCommandOverSsh(
    'ssh-keyscan -t ed25519 localhost | grep -v "^#"',
    context
  );
  return stdout.replace("localhost", context.domain);
};

async function createSshKey(filePath: string, comment?: string) {
  printFunction(`${createSshKey.name} ${filePath}`);
  const normalizedPathToKey = normalizePath(filePath);
  const name = normalizedPathToKey.split("/").at(-1);
  const pathToKeyPub = `${normalizedPathToKey}.pub`;
  const pathToDir = normalizedPathToKey.split("/").slice(0, -1).join("/");

  const pathToKeyFile = file(normalizedPathToKey);
  const pathToKeyPubFile = file(pathToKeyPub);

  if ((await pathToKeyFile.exists()) && (await pathToKeyPubFile.exists())) {
    return await pathToKeyPubFile.text();
  }

  await execCommand(`mkdir -p ${pathToDir}`);

  await execCommand(
    `ssh-keygen -t ed25519 -f ${normalizedPathToKey} -N "" -C "${
      comment || name
    }"`
  );

  await execCommand(`chmod 600 ${normalizedPathToKey}`);

  const pubKey = await Bun.file(pathToKeyPub).text();

  return pubKey;
}

const addSshKeyToAuthorizedOverSsh = async (
  pubKey: string,
  context: Context
) => {
  printFunction(`${addSshKeyToAuthorizedOverSsh.name} ${pubKey}`);
  const { stdout: keys } = await execCommandOverSsh(
    "cat .ssh/authorized_keys",
    context
  );
  if (keys.includes(pubKey)) {
    return;
  }

  await execCommandOverSsh(`echo "${pubKey}" >> .ssh/authorized_keys`, context);
};

export const createAndAddSshKey = async (
  filePath: string,
  comment: string,
  context: Context
) => {
  const normalizedPath = normalizePath(filePath);
  const pubKey = await createSshKey(normalizedPath, comment);

  console.log(`Key is: ${pubKey}`);

  await addSshKeyToAuthorizedOverSsh(pubKey, context);
};

export const addSshKeyToUse = async ({
  key,
  fingerprint,
  filePath,
  server,
}: {
  key: string;
  fingerprint: string;
  filePath: string;
  server: string;
}) => {
  printFunction(`${addSshKeyToUse.name} ${filePath}`);
  const normalizedFilePath = normalizePath(filePath);
  await writeIfNewCompletely(normalizedFilePath, key);
  await execCommand(`chmod 0600 ${normalizedFilePath}`);
  await writeIfNew("~/.ssh/known_hosts", fingerprint);
  await addKeyToHostConfig("~/.ssh/config", server, normalizedFilePath);
};
