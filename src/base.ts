import { spawn } from "bun";
import { debugCommand } from "./debug.ts";
import { Context } from "./context.ts";

export const defaultContext = new Context({
  name: "root",
  address: "0.0.0.0",
  userspace: false,
  sudo: false,
});

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

export const copyFiles = async (from: string, to: string, context: Context) => {
  await execCommand(`rsync -avz ${from} ${context.getAddress()}:${to}`);
};

export const exec = async (command: string, context: Context) => {
  await execCommand(`ssh ${context.getAddress()} "${command}"`);
};
