import { $ } from "bun";
import { defaultContext, execCommand } from "./base.ts";
import { installSystemPackage } from "./packages.ts";
import type { Context } from "./context.ts";
import {
  checkSystemdService,
  createSystemdService,
  getSysyemdServiceName,
  stopSystemdService,
} from "./systemd.ts";

export const installPodman = async () => {
  if ((await $`command -v podman`.nothrow().quiet()).exitCode !== 0) {
    await installSystemPackage("podman");
  }

  await createNetwork();
};

const createNetwork = async () => {
  await execCommand("podman network create ramm");
};

export const getCreateCommand = async (name: string) => {
  const podmanCreateCommand =
    await $`podman inspect --format '{{.Config.CreateCommand}}' ${name}`
      .nothrow()
      .quiet();

  // delete \n => delete []
  return podmanCreateCommand.text().slice(0, -1).slice(1, -1) || "";
};

export const runPodmanContainer = async (name: string, command: string) => {
  if ((await getCreateCommand(name)) !== command) {
    console.log("-----", "rm");
    await $`podman rm -f ${name}`;

    await execCommand(command);
    return;
  }

  console.info("Podman container is already running");
};

export const runPodmanContainerService = async (
  name: string,
  command: string,
  context: Context = defaultContext
) => {
  const serviceName = getSysyemdServiceName(name);

  if (await checkSystemdService(context, serviceName)) {
    await stopSystemdService(context, serviceName);
  }

  await runPodmanContainer(name, command);
  await execCommand(
    `podman generate systemd --name --new ${name} > ${serviceName}`
  );

  await createSystemdService(context, serviceName, serviceName);
};
