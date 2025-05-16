import { execCommand } from "./base/base.ts";

export const localNftChainName = "local_chain";

const createNftTable = (allowed_ssh_ipv4: string) => {
  const nftTable = `table inet ramm {
    set allowed_ssh_ipv4 {
      type ipv4_addr
      flags dynamic
      elements = { ${allowed_ssh_ipv4} }
    }

    chain local_chain {
      iif "lo" accept 
      ct state established,related accept
      ip saddr @allowed_ssh_ipv4 tcp dport 22 accept
      tcp dport 22 ct state new limit rate over 700/minute burst 5 packets drop
      tcp dport 22 accept
      tcp dport 80 accept
      tcp dport 443 accept
      drop
    }

    chain prerouting {
      type filter hook prerouting priority mangle; policy accept;
      fib daddr type local jump local_chain
    }
  }
  `;

  return nftTable;
};
export const setupNftable = async (allowedIpSsh: string) => {
  const listTable = await execCommand("nft list table inet ramm");

  if (listTable.spawnResult.exitCode === 0) {
    await execCommand("nft delete table inet ramm");
  }
  const nftTable = createNftTable(allowedIpSsh);
  await execCommand(`nft -f - <<EOF\n${nftTable}\nEOF`);

  await execCommand("nft list ruleset > /etc/nftables.conf");
  await execCommand("systemctl enable nftables");
};
