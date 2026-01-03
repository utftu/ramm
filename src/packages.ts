import { $ } from "bun";
import { execCommand } from "./base/base.ts";
import type { Context } from "./context.ts";

const dnf_os = ["rocky", "fedora", "alma"];

export const installSystemPackage = async (
  packageName: string,
  context?: Context
) => {
  const osName = (
    await $`cat /etc/os-release | grep ^ID= | cut -d'=' -f2`.text()
  ).trim();

  const checkWhich = await $`which ${packageName}`;

  if (checkWhich.exitCode !== 0) {
    return;
  }

  if (osName === "ubuntu") {
    await execCommand(`apt-get install -y ${packageName}`, {}, context);
  } else if (dnf_os.includes(osName)) {
    await execCommand(`dnf install -y ${packageName}`, {}, context);
  } else {
    throw new Error(`Unsupported OS: ${osName}`);
  }
};
