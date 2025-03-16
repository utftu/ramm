import { spawn } from "bun";
import { debugCommand } from "./debug.ts";
import type { Context } from "./context.ts";

export const execCommand = async (command: string) => {
  debugCommand(command);
  const result = spawn(["bash", "-c", command], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  await result.exited;
};

export const copyFiles = async (context: Context, from: string, to: string) => {
  await execCommand(`rsync -avz ${from} ${context.getAddress()}:${to}`);
};

export const exec = async (context: Context, command: string) => {
  await execCommand(`ssh ${context.getAddress()} "${command}"`);
};
