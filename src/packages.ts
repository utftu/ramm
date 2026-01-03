import { $ } from "bun";
import { execCommand, execCommandMayError } from "./base/base.ts";
import type { Context } from "./context.ts";

const dnfOs = ["rocky", "fedora", "alma"];
const aptOs = ["ubuntu"];

type Manager = "dnf" | "apt";

const getManagerByOs = (osName: string) => {
  if (aptOs.includes(osName)) {
    return "apt";
  } else if (dnfOs.includes(osName)) {
    return "dnf";
  } else {
    throw new Error(`Unsupported OS: ${osName}`);
  }
};

const getManagerConfig = (
  manager: Manager,
  packageConfig: PackageConfig
): ManagerConfig => {
  if (packageConfig.managers && manager in packageConfig.managers) {
    const managerEnt = packageConfig.managers[manager];
    return managerEnt;
  }

  return {
    name: packageConfig.name,
    command: packageConfig.command,
  };
};

const getInstallCommand = (manager: Manager, config: ManagerConfig) => {
  if (manager === "apt") {
    return `apt install -y ${config.name}`;
  } else if (manager === "dnf") {
    return `dnf install -y ${config.name}`;
  } else {
    throw new Error("Unknow manager");
  }
};

type PackageConfig = {
  name: string;
  command: string;
  managers?: Record<Manager, ManagerConfig>;
};

type ManagerConfig = {
  name: string;
  command: string;
};

const packages: Record<string, PackageConfig> = {
  nftables: {
    name: "nftables",
    command: "nft",
  },
  podman: {
    name: "podman",
    command: "podman",
  },
};

export const installSystemPackage = async (
  packageEnt: string | PackageConfig,
  context?: Context
) => {
  const finalPackageEnt =
    typeof packageEnt === "string" ? packages[packageEnt] : packageEnt;

  if (!finalPackageEnt) {
    const errorMessage = `No package ent for: ${packageEnt}`;

    throw new Error(errorMessage);
  }

  const osName = (
    await $`cat /etc/os-release | grep ^ID= | cut -d'=' -f2`.text()
  )
    .trim()
    .replace(/"/g, "");

  const manager = getManagerByOs(osName);
  const managerConfig = getManagerConfig(manager, finalPackageEnt);

  const checkResult = await execCommandMayError(
    `command -v ${managerConfig.command}`,
    {},
    context
  );

  if (checkResult.spawnResult.exitCode === 0) {
    return;
  }

  const installCommand = getInstallCommand(manager, managerConfig);

  await execCommand(installCommand, {}, context);

  if (osName === "ubuntu") {
    await execCommand(`apt-get install -y ${managerConfig.name}`, {}, context);
  } else if (dnfOs.includes(osName)) {
    await execCommand(`dnf install -y ${managerConfig.name}`, {}, context);
  } else {
    throw new Error(`Unsupported OS: ${osName}`);
  }
};
