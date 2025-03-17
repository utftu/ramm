import { $ } from "bun";
import { getCreateCommand, runPodmanContainer } from "./podman.ts";
import { execCommand } from "../base.ts";

const getPossibleSudo = (user: boolean) => {
  if (user) {
    return "";
  } else {
    return "sudo ";
  }
};

const getSystemdStart = (user: boolean) => {
  if (user) {
    return "systemctl --user";
  }

  return "sudo systemctl";
};

const getServiceName = (name: string) => {
  return `${name}.service`;
};

const getPathToService = (serviceName: string, user: boolean) => {
  if (user) {
    return `~/.config/systemd/user/${serviceName}`;
  }

  return `/etc/systemd/system/${serviceName}`;
};

const deleteSystemd = async (nameService: string, user: boolean) => {
  const systemdStart = getSystemdStart(user);

  await execCommand(`${systemdStart} stop ${nameService}`);
  await execCommand(`${systemdStart} disable ${nameService}`);
  await execCommand(
    `${getPossibleSudo(user)} rm -rf ${getPathToService(nameService, user)}`
  );
  await execCommand(`${systemdStart} daemon-reload`);
  await execCommand(`${systemdStart} reset-failed`);
};

const checkSystemd = async (serviceName: string, user: boolean) => {
  const { spawnResult } = await execCommand(
    `${getSystemdStart(user)} is-active ${serviceName}`
  );

  return spawnResult.exitCode === 0;
};

const createSystemdService = async (
  name: string,
  command: string,
  user: boolean
) => {
  const serviceName = getServiceName(name);
  const pathToSevice = getPathToService(serviceName, user);

  // new
  console.log("-----", "new");
  await runPodmanContainer(name, command);
  await execCommand(
    `podman generate systemd --name --new ${name} > ${serviceName}`
  );

  await execCommand(`cp -v ${serviceName} ${pathToSevice}`);

  await execCommand(`${getSystemdStart(user)} daemon-reload`);
  await execCommand(`${getSystemdStart(user)} enable ${getServiceName(name)}`);
  await execCommand(`${getSystemdStart(user)} start ${getServiceName(name)}`);
};

export const runPodmanContainerService = async (
  name: string,
  command: string,
  user: boolean
) => {
  // const createdCommand = await getCreateCommand(name);

  // if (createdCommand === command) {
  //   return;
  // }

  const serviceName = getServiceName(name);

  if (await checkSystemd(serviceName, user)) {
    await execCommand(`${getSystemdStart(user)} stop ${serviceName}`);
  }

  // await deleteSystemd(serviceName, user);

  // if (await checkSystemd(name, user)) {
  //   await deleteSystemd(serviceName, user);
  // }

  // console.log("-----", "3");
  await createSystemdService(name, command, user);
};
