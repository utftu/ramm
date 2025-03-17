import { execCommand } from "./base.ts";

export const setupNftable = async () => {
  await execCommand("nft add table inet filter");
  await execCommand(
    "nft add chain inet filter input { type filter hook input priority 0 ; }"
  );
  await execCommand(
    "nft add chain inet filter forward { type filter hook forward priority 0 ; }"
  );
  await execCommand(
    "nft add chain inet filter output { type filter hook output priority 0 ; }"
  );
  await execCommand("nft add rule inet filter input tcp dport 22 accept");
  await execCommand(
    "nft add rule inet filter input ct state established,related accept"
  );
  await execCommand("nft add rule inet filter input drop");

  await execCommand("nft list ruleset > /etc/nftables.conf");
  await execCommand("systemctl enable nftables");
};
