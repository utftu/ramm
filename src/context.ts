export class Context {
  name: string;
  domain: string;
  userspace: boolean;
  sudo: boolean;
  sshKey?: string;
  params: Record<string, string> = {};

  constructor({
    name,
    address,
    userspace = false,
    sudo = false,
    sshKey,
  }: {
    name: string;
    address: string;
    userspace?: boolean;
    sudo?: boolean;
    sshKey?: string;
  }) {
    this.name = name;
    this.domain = address;
    this.sudo = sudo;
    this.userspace = userspace;
    this.sshKey = sshKey;
  }

  getAddress() {
    return `${this.name}@${this.domain}`;
  }
}
