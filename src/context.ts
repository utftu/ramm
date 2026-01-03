export class Context {
  user: string;
  domain: string;
  userspace: boolean;
  sudo: boolean;
  sshKey?: string;
  params: Record<string, string> = {};

  constructor({
    user,
    address,
    userspace = false,
    sudo = false,
    sshKey,
  }: {
    user: string;
    address: string;
    userspace?: boolean;
    sudo?: boolean;
    sshKey?: string;
  }) {
    this.user = user;
    this.domain = address;
    this.sudo = sudo;
    this.userspace = userspace;
    this.sshKey = sshKey;
  }

  getAddress() {
    return `${this.user}@${this.domain}`;
  }
}
