import { $ } from "bun";
import { defaultContext, execCommand } from "./base/base.ts";
import { installSystemPackage } from "./packages.ts";
import type { Context } from "./context.ts";
import {
  checkSystemdUnit,
  createSystemdService,
  enabledSystemdUnit,
  getSystemdPathToUnit,
  reloadSystemd,
  startSystemdUnit,
  stopSystemdUnit,
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

const getCreateCommand = async (name: string) => {
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

export const createPodmanCommand = ({
  name,
  replace = true,
  background = true,
  networks = ["ramm"],
  envs = [],
  volumes = [],
  command,
}: {
  name?: string;
  replace?: boolean;
  background?: boolean;
  networks?: string[];
  envs?: { name: string; value: string }[];
  volumes?: { from: string; to: string }[];
  command: string;
}) => {
  const values: string[] = [];

  values.push("podman", "run");

  if (name) {
    values.push(`--name ${name}`);
  }

  if (replace) {
    values.push("--replace");
  }

  if (background) {
    values.push("-d");
  }

  for (const network of networks) {
    values.push(`--network ${network}`);
  }

  for (const env of envs) {
    values.push(`-e ${env.name}=${env.value}`);
  }

  for (const volume of volumes) {
    values.push(`-v ${volume.from}:${volume.to}`);
  }

  values.push(command);

  const str = values.join(" ");
  return str;
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
  const serviceName = `${name}.service`;
  const filepath = getSystemdPathToUnit(serviceName);

  if (await checkSystemdUnit(serviceName, context)) {
    await stopSystemdUnit(serviceName, context);
  }

  await runPodmanContainer(name, command);
  await execCommand(
    `podman generate systemd --name --new ${name} > ${filepath}`
  );
  await reloadSystemd(context);
  await startSystemdUnit(serviceName, context);
  await enabledSystemdUnit(serviceName, context);
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
