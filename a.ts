const debugInternal = (func: string, command: string) => {
  console.info(`>>>${func}<<< ${command}`);
};

export const debug = (text: string) => {
  debugInternal("\x1b[33mDebug\x1b[0m", `\x1b[38;5;215m${text}\x1b[0m`);
};

debug("Debugging started");
