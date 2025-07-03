const tee = async (
  read: ReadableStream,
  write: (text: string) => void,
  prefix: string
) => {
  const reader = read.getReader();
  let leftover = "";
  let output = "";

  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      if (leftover) write(prefix + leftover + "\n");
      return output;
    }

    const decodedOutput = decoder.decode(value, { stream: true });
    output += decodedOutput;

    const lines = (leftover + decodedOutput).split("\n");
    leftover = lines.pop() ?? "";

    for (const line of lines) {
      write(prefix + line + "\n");
    }
  }
};

export const teeStdout = (read: ReadableStream, prefix: string) => {
  return tee(read, (text) => process.stdout.write(text), prefix);
};
export const teeStderr = (read: ReadableStream, prefix: string) => {
  return tee(read, (text) => process.stderr.write(text), prefix);
};
