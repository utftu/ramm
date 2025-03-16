import { $ } from "bun";
import { execCommand } from "./base.ts";

export const installSystemPackage = async (packageName: string) => {
  const osName = (
    await $`cat /etc/os-release | grep ^ID= | cut -d'=' -f2`.text()
  ).trim();

  console.log("-----", "osName", osName.replace(/\n/, "\\n"));
  if (osName === "ubuntu") {
    console.log("-----", "if");
    await execCommand(`apt-get install -y ${packageName}`);
  }
};
