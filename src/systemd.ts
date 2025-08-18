import {
  defaultContext,
  execCommand,
  execCommandMayError,
} from "./base/base.ts";
import { Context } from "./context.ts";
import { writeFileFull } from "./files.ts";
import { printFunction } from "./print.ts";

export type ServiceProps = {
  unit?: {
    description?: string;
  };
  service: {
    type: string;
    execStart: string;
    successExitStatus?: string;
  };
  install: {
    wantedBy: string | string[];
  };
};

export const createServiceContent = (serviceProps: ServiceProps) => {
  let str = "";

  for (const sectionName in serviceProps) {
    if (str) {
      str += "\n";
    }
    str += `${sectionName[0]!.toUpperCase()}${sectionName.slice(1)}\n`;

    const section = serviceProps[sectionName as keyof typeof serviceProps];

    for (const sectionKey in section) {
      const sectionValue = section[sectionKey as keyof typeof section];
      const arrayValues = Array.isArray(sectionValue)
        ? sectionValue
        : [sectionValue];

      for (const value of arrayValues) {
        str += `${sectionKey[0]!.toUpperCase()}${sectionKey.slice(
          1
        )}=${value}\n`;
      }
    }
  }

  return str;
};

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

export const createdSystemdTimer = async (
  serviceName: string,
  execStr: string
) => {
  const pathToSeviceTarget = getSystemdPathToService(
    defaultContext,
    serviceName
  );

  const serviceContent = `
[Unit]
Description=${serviceName}.service

[Service]
Type=oneshot
ExecStart=${execStr}
SuccessExitStatus=1

[Install]
WantedBy=timers.target
`;

  const timerContent = ``;
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
