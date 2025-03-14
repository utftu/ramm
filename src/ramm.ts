import { $, spawn, file, write } from "bun";

const debugInternal = (func: string, command: string) => {
  console.info(`>>>${func}<<< ${command}`);
};

const debugCommand = (command: string) => {
  debugInternal("\x1b[32mCommand\x1b[0m", `\x1b[38;5;85m${command}\x1b[0m`);
};

export const debug = (text: string) => {
  debugInternal("\x1b[34mBlock\x1b[0m", `\x1b[38;5;81m${text}\x1b[0m`);
};

const execCommand = async (command: string) => {
  debugCommand(command);
  const result = spawn(["bash", "-c", command], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  await result.exited;
};

export class Context {
  name: string;
  domain: string;
  constructor(name: string, address: string) {
    this.name = name;
    this.domain = address;
  }

  getAddress() {
    return `${this.name}@${this.domain}`;
  }
}

export const copyFiles = async (context: Context, from: string, to: string) => {
  await execCommand(`rsync -avz ${from} ${context.getAddress()}:${to}`);
};

export const exec = async (context: Context, command: string) => {
  await execCommand(`ssh ${context.getAddress()} "${command}"`);
};

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

export const installBun = async (context: Context) => {
  const bunPath = new URL(import.meta.resolve("./bun.sh")).pathname;

  await copyFiles(context, bunPath, "./bun.sh");
  await exec(context, "./bun.sh");
};
