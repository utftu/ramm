export const tee = async (read: ReadableStream) => {
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

export const teeErr = async (read: ReadableStream) => {
  const reader = read.getReader();
  let output = "";

  while (true) {
    const { value, done: doneReading } = await reader.read();
    if (doneReading) {
      return output;
    }

    const decoder = new TextDecoder("utf-8");

    output += decoder.decode(value);
    process.stderr.write(value);
  }
};

export const readStreamToStr = async (read: ReadableStream) => {
  const reader = read.getReader();
  let output = "";

  while (true) {
    const { value, done: doneReading } = await reader.read();
    if (doneReading) {
      return output;
    }

    const decoder = new TextDecoder("utf-8");

    output += decoder.decode(value);
  }
};
