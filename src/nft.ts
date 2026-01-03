import { execCommand, execCommandMayError } from "./base/base.ts";
import { installSystemPackage } from "./packages.ts";

export const localNftChainName = "local_chain";

const createNftTable = ({
  allowedIpV4,
  allowedPorts = [],
}: {
  allowedIpV4: string[];
  allowedPorts?: (string | number)[];
}) => {
  const nftTable = `table inet ramm {
    set allowed_ipv4 {
      type ipv4_addr
      flags dynamic
      elements = { ${allowedIpV4.join("\n\t")} }
    }

    chain local_chain_base {
      iif "lo" accept
      ct state established,related accept
      ip saddr @allowed_ipv4 tcp dport 22 accept
      tcp dport 22 ct state new limit rate over 700/minute burst 5 packets drop
      tcp dport 22 accept
      ${allowedPorts
        .map((port) => {
          return `tcp dport ${port} accept`;
        })
        .join("\n")}
    }

    chain local_chain {
      jump local_chain_base
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
export const setupNftable = async ({
  allowedIpV4,
  allowedPorts,
}: {
  allowedIpV4: string[];
  allowedPorts: string[];
}) => {
  await installSystemPackage("nftables");

  const listTable = await execCommandMayError("nft list table inet ramm");

  if (listTable.spawnResult.exitCode === 0) {
    await execCommand("nft delete table inet ramm");
  }
  const nftTable = createNftTable({ allowedIpV4, allowedPorts });
  await execCommand(`nft -f - <<EOF\n${nftTable}\nEOF`);

  await safeNftTable();
};

export const safeNftTable = async () => {
  await execCommand("nft list ruleset > /etc/nftables.conf");
  await execCommand("systemctl enable nftables");
};
