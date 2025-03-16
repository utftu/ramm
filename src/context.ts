export class Context {
  name: string;
  domain: string;
  constructor(name: string, address: string) {
    this.name = name;
    this.domain = address;
  }

  getAddress() {
    return `${this.name}@${this.domain}`;
  }
}
