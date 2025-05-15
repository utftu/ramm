import { $ } from "bun";
import { defaultContext, execCommandMayError } from "./base/base.ts";
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
  const netwroks = await execCommandMayError(
    "podman network inspect $(podman network ls -q) -f '{{.NetworkInterface}}'"
  );
  if (netwroks.output.includes("podman_ramm")) {
    return;
  }
  await execCommandMayError(
    "podman network create --interface-name=podman_ramm ramm"
  );
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
  return await execCommandMayError(
    `echo "${password}" | podman login --username "${login}" --password-stdin ${address}`
  );
};

export const runPodmanContainer = async (name: string, command: string) => {
  if ((await getCreateCommand(name)) !== command) {
    await $`podman rm -f ${name}`;

    await execCommandMayError(command);
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
  await execCommandMayError(
    `podman generate systemd --name --new ${name} > ${serviceName}`
  );

  await createSystemdService(context, serviceName, serviceName);
};

export const addNftPodmanRule = async () => {
  const podmanNetworksResult = await execCommandMayError(
    "podman network inspect $(podman network ls -q) -f '{{.NetworkInterface}}'"
  );
  const podmanNetworks = podmanNetworksResult.output.trim().split("\n");

  await execCommandMayError(
    `nft add set inet ramm podman_interfaces '{ type ifname; flags dynamic; elements = { ${podmanNetworks.join(
      ", "
    )} }; }'`
  );

  await execCommandMayError(
    "nft insert rule inet ramm prerouting iifname @podman_interfaces accept"
  );
};
