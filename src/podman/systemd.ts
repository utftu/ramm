import { $ } from "bun";
import { getCreateCommand, runPodmanContainer } from "./podman.ts";

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
  return `${name}_podman.service`;
};

const getPathToService = (serviceName: string, user: boolean) => {
  if (user) {
    return `~/.config/systemd/user/${serviceName}`;
  }

  return `/etc/systemd/system/${serviceName}`;
};

const deleteSystemd = async (nameService: string, user: boolean) => {
  const systemdStart = getSystemdStart(user);

  await $`${systemdStart} stop ${nameService}`;
  await $`${systemdStart} disable ${nameService}`;

  await $`${getPossibleSudo(user)} rm -rf ${getPathToService(
    nameService,
    user
  )}`;
};

const checkSystemd = async (serviceName: string, user: boolean) => {
  const command = user ? "systemctl --user" : "sudo systemctl";
  const result = await $`${command} is-active ${serviceName}`.nothrow().quiet();

  return result.exitCode === 0;
};

const createSystemdService = async (
  name: string,
  command: string,
  user: boolean
) => {
  const serviceName = getServiceName(name);
  const pathToSevice = getPathToService(name, user);

  // new
  await runPodmanContainer(name, command);
  await $`podman generate systemd --name --new ${serviceName} > ${serviceName}`;

  await $`move -v ${serviceName} ${pathToSevice}`;

  if (user) {
    await $`systemctl --user daemon-reload`;
  } else {
    await $`sudo systemctl daemon-reload`;
  }
};

export const runPodmansContainerService = async (
  name: string,
  command: string,
  user: boolean
) => {
  const createdCommand = await getCreateCommand(name);

  if (createdCommand === command) {
    return;
  }

  const serviceName = getServiceName(name);

  if (await checkSystemd(name, user)) {
    await deleteSystemd(serviceName, user);
  }

  await createSystemdService(name, command, user);
};
