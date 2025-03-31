import { execCommand, execCommandSilent } from "./base.ts";

export const localNftChainName = "local_chain";

export const setupNftable = async (allowedIpSsh: string) => {
  const listTable = await execCommandSilent("nft list table inet ramm");

  if (listTable.spawnResult.exitCode === 0) {
    await execCommand("nft delete table inet ramm");
  }

  await execCommand("nft add table inet ramm");
  await execCommand(
    "nft add chain inet ramm input '{ type filter hook input priority 0 ; }'"
  );
  await execCommand(
    `nft add set inet ramm allowed_ssh_ipv4 '{ type ipv4_addr; flags dynamic; elements = { ${allowedIpSsh} } }'`
  );
  await execCommand(`nft add chain inet ramm ${localNftChainName}`);
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} iif lo accept`
  );
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} ct state established,related accept`
  );
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} ip saddr @allowed_ssh_ipv4 tcp dport 22 accept`
  );
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} tcp dport 22 ct state new limit rate over 3/minute drop`
  );
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} tcp dport 22 accept`
  );
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} tcp dport 80 accept`
  );
  await execCommand(
    `nft add rule inet ramm ${localNftChainName} tcp dport 443 accept`
  );
  await execCommand(`nft add rule inet ramm ${localNftChainName} drop`);

  await execCommand(
    "nft add rule inet ramm input fib daddr type local jump local_chain "
  );

  // const podmanNetworksResult = await execCommand(
  //   "podman network inspect $(podman network ls -q) -f '{{.NetworkInterface}}'"
  // );
  // const podmanNetworks = podmanNetworksResult.output.trim().split("\n");

  // await execCommand(
  //   `nft add set inet ramm podman_interfaces '{ type ifname; flags dynamic; elements = { ${podmanNetworks.join(
  //     ", "
  //   )} }; }'`
  // );

  // await execCommand(
  //   "nft add rule inet ramm prerouting fib daddr type local iifname != @podman_interfaces jump prerouting_local "
  // );
};
