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
import { localNftChainName } from "./nft.ts";

export const installPodman = async () => {
  if ((await $`command -v podman`.nothrow().quiet()).exitCode !== 0) {
    await installSystemPackage("podman");
  }

  await createNetwork();
};

const createNetwork = async () => {
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
  const podmanNetworks = podmanNetworksResult.output.trim().split("\n");

  await execCommand(
    `nft add set inet ramm podman_interfaces '{ type ifname; flags dynamic; elements = { ${podmanNetworks.join(
      ", "
    )} }; }'`
  );

  await execCommand(
    "nft add chain inet ramm forward '{ type filter hook input priority 0 ; }'"
  );

  await execCommand(
    `nft add rule inet ramm forward iifname @podman_interfaces jump ${localNftChainName}`
  );
};
