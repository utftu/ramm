import { execCommand } from "./base.ts";

const checkRuleAndRun = async (table: string, rule: string) => {
  if (table.includes(rule)) {
    return;
  }

  await execCommand(`"nft add rule inet filter input ${rule}`);
};

export const setupNftable = async (allowedIpToSsh: string) => {
  const listTable = await execCommand("nft list table inet ramm");

  console.log(
    "-----",
    "listTable.spawnResult.exitCode",
    listTable.spawnResult.exitCode
  );
  if (listTable.spawnResult.exitCode === 0) {
    return;
  }

  await execCommand("nft add table inet ramm");
  await execCommand(
    "nft add chain inet ramm prerouting '{ type filter hook prerouting priority 0 ; }'"
  );

  await execCommand("nft add rule inet ramm prerouting iif lo accept");
  await execCommand(
    "nft add rule inet ramm prerouting ct state established,related accept"
  );
  await execCommand(
    `nft add rule inet ramm prerouting ip saddr ${allowedIpToSsh} tcp dport 22 accept`
  );
  await execCommand(
    "nft add rule inet ramm prerouting tcp dport 22 ct state new limit rate over 3/minute drop"
  );
  await execCommand("nft add rule inet ramm prerouting tcp dport 22 accept");
  await execCommand("nft add rule inet ramm prerouting tcp dport 80 accept");
  await execCommand("nft add rule inet ramm prerouting tcp dport 443 accept");

  await execCommand("nft add rule inet ramm prerouting drop");
};

// export const setupNftable = async (allowedIpToSsh: string) => {
//   await execCommand("nft add table inet filter");
//   await execCommand(
//     "nft add chain inet filter input '{ type filter hook input priority 0 ; }'"
//   );

//   const listCommdn = await execCommand("nft list chain inet filter input");

//   await checkRuleAndRun(listCommdn.output, 'iif "lo" accept');
//   await checkRuleAndRun(listCommdn.output, "tcp dport 22 accept");
//   await checkRuleAndRun(
//     listCommdn.output,
//     "ct state established,related accept"
//   );
//   await checkRuleAndRun(
//     listCommdn.output,
//     `ip saddr ${allowedIpToSsh} tcp dport 22 accept`
//   );
//   await checkRuleAndRun(
//     listCommdn.output,
//     `tcp dport 22 ct state new limit rate over 3/minute drop`
//   );
//   await checkRuleAndRun(listCommdn.output, "drop");

//   await execCommand("nft list ruleset > /etc/nftables.conf");
//   await execCommand("systemctl enable nftables");
// };
