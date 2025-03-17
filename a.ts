import { spawn } from "bun";

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

const output = await execCommand("ls /sdsdsd/sdsd");
console.log("-----", output.spawnResult.exitCode); // Выводим результат
