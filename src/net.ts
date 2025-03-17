import { execCommand } from "./base.ts";

const setupUfw = async () => {
  const ufwStatus = await execCommand("ufw status");

  if (ufwStatus.output === 'in')
};
