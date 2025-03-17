import { $ } from "bun";
import { execCommand } from "./base.ts";

export const installSystemPackage = async (packageName: string) => {
  const osName = (
    await $`cat /etc/os-release | grep ^ID= | cut -d'=' -f2`.text()
  ).trim();

  if (osName === "ubuntu") {
    await execCommand(`apt-get install -y ${packageName}`);
  }
};
