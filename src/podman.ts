import { $ } from "bun";
import { defaultContext, execCommand } from "./base/base.ts";
import { installSystemPackage } from "./packages.ts";
import type { Context } from "./context.ts";
import {
  checkSystemdService,
  createSystemdService,
  getSysyemdServiceName,
  stopSystemdService,
} from "./systemd.ts";
import { safeNftTable } from "./nft.ts";

export const installPodman = async () => {
  if ((await $`command -v podman`.nothrow().quiet()).exitCode !== 0) {
    await installSystemPackage("podman");
  }

  await createNetwork();
};

const createNetwork = async () => {
  const netwroks = await execCommand(
    "podman network inspect $(podman network ls -q) -f '{{.NetworkInterface}}'"
  );
  const podmanNetworks = await execCommand("podman network ls");

  if (podmanNetworks.stdout.includes("ramm")) {
    return;
  }
  if (netwroks.stdout.includes("podman_ramm")) {
    return;
  }
  await execCommand("podman network create --interface-name=podman_ramm ramm");
};

export const getCreateCommand = async (name: string) => {
  const podmanCreateCommand =
    await $`podman inspect --format '{{.Config.CreateCommand}}' ${name}`
      .nothrow()
      .quiet();

  // delete \n => delete []
  return podmanCreateCommand.text().slice(0, -1).slice(1, -1) || "";
};

export const loginPodman = async (
  address: string,
  login: string,
  password: string
) => {
  return await execCommand(
    `echo "${password}" | podman login --username "${login}" --password-stdin ${address}`
  );
};

export const runPodmanContainer = async (name: string, command: string) => {
  if ((await getCreateCommand(name)) !== command) {
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

export const addNftPodmanRule = async () => {
  const podmanNetworksResult = await execCommand(
    "podman network inspect $(podman network ls -q) -f '{{.NetworkInterface}}'"
  );
  const podmanNetworks = podmanNetworksResult.stdout.trim().split("\n");

  await execCommand(
    `nft add set inet ramm podman_interfaces '{ type ifname; flags dynamic; elements = { ${podmanNetworks.join(
      ", "
    )} }; }'`
  );

  await execCommand(
    "nft insert rule inet ramm prerouting iifname @podman_interfaces accept"
  );

  await safeNftTable();
};
