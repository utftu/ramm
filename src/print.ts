const printInternal = (left: string, right: string) => {
  console.info(`\x1b[32m${left}:\x1b[0m \x1b[38;5;85m${right}\x1b[0m`);
};

export const printCommand = (command: string) => {
  printInternal("Command", command);
};

export const printFunction = (func: string) => {
  printInternal("Function", func);
};

export const printBlock = (name: string) => {
  console.info(`\x1b[34mBlock:\x1b[0m \x1b[38;5;81m${name}\x1b[0m`);
};
