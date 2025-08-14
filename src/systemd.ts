import {
  defaultContext,
  execCommand,
  execCommandMayError,
} from "./base/base.ts";
import { Context } from "./context.ts";
import { writeFileFull } from "./files.ts";
import { printFunction } from "./print.ts";

// MUST START WITH systemctl
const systemctlWordLangth = "systemctl ".length;
const formatUserspace = (context: Context, command: string) => {
  const userPart = context.userspace ? " --user " : "";
  return "systemctl" + userPart + " " + command.slice(systemctlWordLangth);
};

export const getSysyemdServiceName = (name: string) => {
  return `${name}.service`;
};

const getSystemdPathToService = (context: Context, serviceName: string) => {
  if (context.userspace) {
    return `~/.config/systemd/user/${serviceName}`;
  }

  return `/etc/systemd/system/${serviceName}`;
};

export const stopSystemdService = async (constext: Context, name: string) => {
  await execCommand(formatUserspace(constext, `systemctl stop ${name}`));
};

export const restartSystemdService = async (
  name: string,
  constext: Context = defaultContext
) => {
  printFunction(`restartSystemdService ${name}`);
  await execCommand(formatUserspace(constext, `systemctl restart ${name}`));
};

export const checkSystemdService = async (
  context: Context,
  serviceName: string
) => {
  const { spawnResult } = await execCommandMayError(
    formatUserspace(context, `systemctl is-active ${serviceName}`)
  );

  return spawnResult.exitCode === 0;
};

export const createSystemdServiceByContent = async (
  serviceName: string,
  content: string,
  context: Context = defaultContext
) => {
  printFunction(`createSystemdServiceByContent ${serviceName}`);
  const pathToSeviceTarget = getSystemdPathToService(context, serviceName);

  await writeFileFull(pathToSeviceTarget, content);

  await execCommand(formatUserspace(context, "systemctl daemon-reload"));
  await execCommand(
    formatUserspace(context, `systemctl enable ${serviceName}`)
  );
  await execCommand(formatUserspace(context, `sysyemctl start ${serviceName}`));
};

export const createSystemdService = async (
  context: Context,
  serviceName: string,
  pathToServiceFile: string
) => {
  printFunction(`createSystemdService ${serviceName}`);
  const pathToSeviceTarget = getSystemdPathToService(context, serviceName);

  await execCommand(`cp -v ${pathToServiceFile} ${pathToSeviceTarget}`);

  await execCommand(formatUserspace(context, "systemctl daemon-reload"));
  await execCommand(
    formatUserspace(context, `systemctl enable ${serviceName}`)
  );
  await execCommand(formatUserspace(context, `sysyemctl start ${serviceName}`));
};
