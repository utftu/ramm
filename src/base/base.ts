import { spawn } from "bun";
import { debugCommand, debugSilentCommand } from "../debug.ts";
import { Context } from "../context.ts";
import { readStreamToStr, tee, teeErr } from "./tee.ts";

export const defaultContext = new Context({
  name: "root",
  address: "0.0.0.0",
  userspace: false,
  sudo: false,
});

export const execCommandMayError = async (command: string) => {
  debugCommand(command);
  const result = spawn(["bash", "-c", command], {
    stdin: "inherit",
    stdout: "pipe", // Перехватываем stdout
    stderr: "pipe",
  });

  const [output, outputErr] = await Promise.all([
    tee(result.stdout),
    teeErr(result.stderr),
  ]);

  await result.exited;

  return {
    outputErr,
    output,
    spawnResult: result,
  };
};

export const execCommand = async (command: string) => {
  const result = await execCommandMayError(command);

  if (result.spawnResult.exitCode !== 0) {
    console.error(">>>Error<<<");
    console.error("command:", command);

    throw new Error(command);
  }

  return result;
};

export const execCommandSilent = async (command: string) => {
  debugSilentCommand(command);
  const result = spawn(["bash", "-c", command]);

  const output = await readStreamToStr(result.stdout);

  await result.exited;

  return {
    output,
    spawnResult: result,
  };
};

export const copyFilesBySsh = async (
  from: string,
  to: string,
  context: Context
) => {
  await execCommand(`rsync -avz ${from} ${context.getAddress()}:${to}`);
};

export const execBySsh = async (command: string, context: Context) => {
  const sshKeyPart = context.sshKey ? ` -i ${context.sshKey}` : "";
  return await execCommand(
    `ssh${sshKeyPart} ${context.getAddress()} '${command}'`
  );
};
