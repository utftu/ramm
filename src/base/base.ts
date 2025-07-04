import { spawn, type Subprocess } from "bun";
import { printCommand } from "../print.ts";
import { Context } from "../context.ts";
import { teeStderr, teeStdout } from "./tee.ts";

export const defaultContext = new Context({
  name: "root",
  address: "0.0.0.0",
  userspace: false,
  sudo: false,
});

export type ExecCommandStore = {
  spawnResult?: Subprocess<"inherit", "pipe", "pipe">;
};

type ExecProps = {
  store?: ExecCommandStore;
  env?: Record<string, string>;
  cwd?: string;
  prefix?: string;
  signal?: AbortSignal;
} | void;

export const execCommandRaw = async (
  command: string,
  { store = {}, signal, env, cwd, prefix = "" }: ExecProps = {}
) => {
  const spawnResult = spawn(["bash", "-c", command], {
    stdin: "inherit",
    stdout: "pipe",
    stderr: "pipe",
    signal,
    cwd,
    env,
  });

  store.spawnResult = spawnResult;

  const [stdout, stderr] = await Promise.all([
    teeStdout(spawnResult.stdout, prefix),
    teeStderr(spawnResult.stderr, prefix),
  ]);

  await spawnResult.exited;

  return {
    stderr,
    stdout,
    spawnResult,
  };
};

export const execCommandMayError = async (
  command: string,
  props: ExecProps
) => {
  printCommand(command);
  return execCommandRaw(command, props);
};

export const execCommand = async (command: string, props: ExecProps) => {
  const result = await execCommandMayError(command, props);

  if (result.spawnResult.exitCode !== 0) {
    console.error(`Error exit code: ${result.spawnResult.exitCode}`);
    console.error(`Command: ${command}`);

    throw new Error(command);
  }

  return result;
};

export const copyFilesBySsh = async (
  from: string,
  to: string,
  context: Context
) => {
  await execCommand(`rsync -avz ${from} ${context.getAddress()}:${to}`);
};

// export const execBySsh = async (command: string, context: Context) => {
//   const sshKeyPart = context.sshKey ? ` -i ${context.sshKey}` : "";
//   return await execCommand(
//     `ssh${sshKeyPart} ${context.getAddress()} '${command}'`
//   );
// };

export const execCommandOverSsh = async (command: string, context: Context) => {
  const sshKeyPart = context.sshKey ? ` -i ${context.sshKey}` : "";
  return await execCommand(
    `ssh${sshKeyPart} ${context.getAddress()} '${command}'`
  );
};
