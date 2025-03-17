import { execCommand } from "./base.ts";

const setupBasicIptablesRules = async () => {
  await addRuleIfNotExist("INPUT -p tcp --dport 22 -j ACCEPT");
  await addRuleIfNotExist(
    "INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT"
  );
};

const addRuleIfNotExist = async (rule: string) => {
  if (
    (await execCommand(`sudo iptables -C ${rule}`)).spawnResult.exitCode === 0
  ) {
    return;
  }

  await execCommand(`sudo iptables -A ${rule}`);
};
