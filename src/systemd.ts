import {
  defaultContext,
  execCommand,
  execCommandMayError,
} from "./base/base.ts";
import { Context } from "./context.ts";
import { writeFileFull } from "./files.ts";

// MUST START WITH systemctl
const systemctlWordLangth = "systemctl ".length;
const formatUserspace = (
  command: string,
  context: Context = defaultContext
) => {
  const userPart = context.userspace ? " --user " : "";
  return "systemctl" + userPart + " " + command.slice(systemctlWordLangth);
};

const reloadSystemd = async (context: Context = defaultContext) => {
  await execCommand(formatUserspace("systemctl daemon-reload", context));
};

export const startSystemdUnit = async (
  unitName: string,
  context: Context = defaultContext
) => {
  await execCommand(formatUserspace(`systemctl start ${unitName}`, context));
};

export const enabledSystemdUnit = async (
  unitName: string,
  context: Context = defaultContext
) => {
  await execCommand(formatUserspace(`systemctl enable ${unitName}`, context));
};

export const restartSystemdUnit = async (
  name: string,
  context: Context = defaultContext
) => {
  await execCommand(formatUserspace(`systemctl restart ${name}`, context));
};

export const stopSystemdUnit = async (
  name: string,
  context: Context = defaultContext
) => {
  await execCommand(formatUserspace(`systemctl stop ${name}`, context));
};

export const checkSystemdUnit = async (
  serviceName: string,
  context: Context = defaultContext
) => {
  const { spawnResult } = await execCommandMayError(
    formatUserspace(`systemctl is-active ${serviceName}`, context)
  );

  return spawnResult.exitCode === 0;
};

export const createSystemdUnit = async (
  unitName: string,
  content: string,
  context: Context = defaultContext
) => {
  const pathToSeviceTarget = getSystemdPathToService(unitName, context);

  await writeFileFull(pathToSeviceTarget, content);
  await execCommand(
    formatUserspace(`systemctl daemon-reload ${unitName}`, context)
  );
};

export const getSystemdPathToService = (
  serviceName: string,
  context: Context = defaultContext
) => {
  if (context.userspace) {
    return `~/.config/systemd/user/${serviceName}`;
  }

  return `/etc/systemd/system/${serviceName}`;
};

export const createSystemdService = async (
  serviceName: string,
  content: string,
  context: Context = defaultContext
) => {
  await createSystemdUnit(serviceName, content, context);
  await enabledSystemdUnit(`systemctl enable ${serviceName}`, context);
  await startSystemdUnit(`systemctl start ${serviceName}`, context);
};
