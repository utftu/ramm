export class Context {
  name: string;
  domain: string;
  userspace: boolean;
  sudo: boolean;

  constructor({
    name,
    address,
    userspace = false,
    sudo = false,
  }: {
    name: string;
    address: string;
    userspace?: boolean;
    sudo?: boolean;
  }) {
    this.name = name;
    this.domain = address;
    this.sudo = sudo;
    this.userspace = userspace;
  }

  getAddress() {
    return `${this.name}@${this.domain}`;
  }
}
