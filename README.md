## Overview

RAMM is a Bun library designed to simplify remote server management, deployment automation, and container operations with JS. Ansibsle inspired mechanism, but in JS with imperative commands

It provides utilities for:

- Remote command execution over SSH
- File synchronization using rsync
- System package management
- Podman container management

## Installation

```bash
bun add ramm
# or
npm install ramm
```

## Quick Start Example

```ts
import { $, build } from "bun";
import { Context, exec, copyFiles, debug, installBun } from "ramm";

const context = new Context("root", "example.com");

debug("Install bun");
await installBun(context);

debug("Build project");
await build({
  outdir: "dist",
  entrypoints: ["src/server.ts"],
  target: "bun",
});

debug("Deploy files");
await copyFiles(context, "./dist/", "./dist");

debug("Start server");
await exec(context, "bun run ./dist/server.js");
```

## Core API Reference

### Context Class

Data storage to connect server

```ts
class Context {
  constructor(name: string, address: string);
  getAddress(): string;
}
```

- name: Server username
- address: Server IP/hostname
- getAddress(): Returns "user@host" format

### copyFiles

```ts
copyFiles(context: Context, from: string, to: string)
```

Uses rsync to copy files to remote server. Supports directories.

Example

```ts
await copyFiles(context, "./local", "/remote/path");
```

### Exec

```ts
exec(context: Context, command: string)
```

Executes command on remote server via SSH.

Example

```ts
await exec(ctx, "systemctl restart nginx");
```

### Install system package

```ts
installSystemPackage(packageName: string)
```

Auto-detects OS and uses appropriate package manager.

Example

```ts
await installSystemPackage("nginx");
```

### Install podman

```ts
installPodman(packageName: string)
```

Installs Podman if not present.

Example

```ts
await installPodman();
```

### Install podman

```ts
runPodmanContainer(command: string, name: string)
```

Smart container management:

- Checks if container exists
- Recreates if configuration changed
- Skips if already running

Example

```ts
await runPodmanContainer("podman run -d --name web nginx", "web");
```

### Install bun

```ts
installBun(context: Context)
```

Smart container management:

- Copies installation script to server
- Executes bun.sh on remote host

Example

```ts
await installBun(context);
```
