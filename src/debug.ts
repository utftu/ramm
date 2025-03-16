const debugInternal = (func: string, command: string) => {
  console.info(`>>>${func}<<< ${command}`);
};

export const debugCommand = (command: string) => {
  debugInternal("\x1b[32mCommand\x1b[0m", `\x1b[38;5;85m${command}\x1b[0m`);
};

export const debug = (text: string) => {
  debugInternal("\x1b[34mBlock\x1b[0m", `\x1b[38;5;81m${text}\x1b[0m`);
};
