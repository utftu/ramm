import { spawn } from "bun";
import { debugCommand } from "./debug.ts";
import type { Context } from "./context.ts";

const tee = async (read: ReadableStream) => {
  const reader = read.getReader();
  let output = "";

  while (true) {
    const { value, done: doneReading } = await reader.read();
    if (doneReading) {
      return output;
    }

    const decoder = new TextDecoder("utf-8");

    output += decoder.decode(value);
    process.stdout.write(value);
  }
};

export const execCommand = async (command: string) => {
  debugCommand(command);
  const result = spawn(["bash", "-c", command], {
    stdin: "inherit",
    stdout: "pipe", // Перехватываем stdout
    stderr: "inherit",
  });

  const output = await tee(result.stdout);

  await result.exited;

  return {
    output,
    spawnResult: result,
  };
};

export const copyFiles = async (context: Context, from: string, to: string) => {
  await execCommand(`rsync -avz ${from} ${context.getAddress()}:${to}`);
};

export const exec = async (context: Context, command: string) => {
  await execCommand(`ssh ${context.getAddress()} "${command}"`);
};
