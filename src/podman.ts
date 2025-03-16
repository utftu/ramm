import { $, file, write } from "bun";
import { execCommand } from "./base.ts";
import { installSystemPackage } from "./packages.ts";

export const installPodman = async () => {
  if ((await $`command -v podman`.nothrow().quiet()).exitCode !== 0) {
    await installSystemPackage("podman");
  }

  await setupRegistry();
};

export const runPodmanContainer = async (command: string, name: string) => {
  const podmanCreateCommand =
    await $`podman inspect --format '{{.Config.CreateCommand}}' ${name}`
      .nothrow()
      .quiet();

  if (podmanCreateCommand.exitCode !== 0) {
    await execCommand(command);
    return;
  }

  // delete \n
  const podmanCreateCommandText = podmanCreateCommand.text().slice(0, -1);

  if (podmanCreateCommandText !== `[${command}]`) {
    await $`podman rm -f ${name}`;

    execCommand(command);
    return;
  }

  console.info("Podman container is already running");
};

const setupRegistry = async () => {
  const confFilePath = "/etc/containers/registries.conf";
  const configFile = file(confFilePath);

  if (!(await configFile.exists())) {
    await $`mkdir -p /etc/containers`;
    await write(confFilePath, "");
  }

  if (
    (
      await $`cat /etc/containers/registries.conf | grep ^unqualified-search-registries`
        .nothrow()
        .quiet()
    ).exitCode !== 0
  ) {
    await $`echo 'unqualified-search-registries = ["docker.io", "quay.io"]' >> /etc/containers/registries.conf`;
  }
};
