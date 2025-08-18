import { describe, expect, it } from "vitest";
import { createServiceContent, type ServiceProps } from "./systemd.ts";

describe("createServiceContent", () => {
  it("должна собрать базовый сервис с одним wantedBy", () => {
    const input: ServiceProps = {
      service: {
        type: "oneshot",
        execStart: "/bin/true",
      },
      install: {
        wantedBy: "multi-user.target",
      },
    };

    const result = createServiceContent(input);

    expect(result).toBe(
      "Service\nType=oneshot\nExecStart=/bin/true\n\nInstall\nWantedBy=multi-user.target\n"
    );
  });

  it("должна корректно обрабатывать массив wantedBy", () => {
    const input: ServiceProps = {
      service: {
        type: "simple",
        execStart: "/usr/bin/myapp",
      },
      install: {
        wantedBy: ["multi-user.target", "default.target"],
      },
    };

    const result = createServiceContent(input);

    expect(result).toContain("WantedBy=multi-user.target\n");
    expect(result).toContain("WantedBy=default.target\n");
  });

  it("должна добавлять секцию Unit, если указана", () => {
    const input: ServiceProps = {
      unit: {
        description: "My Test Service",
      },
      service: {
        type: "forking",
        execStart: "/usr/bin/myapp --daemon",
        successExitStatus: "1 2",
      },
      install: {
        wantedBy: "multi-user.target",
      },
    };

    const result = createServiceContent(input);

    expect(result).toContain("Unit\nDescription=My Test Service\n");
    expect(result).toContain(
      "Service\nType=forking\nExecStart=/usr/bin/myapp --daemon\nSuccessExitStatus=1 2\n"
    );
    expect(result).toContain("Install\nWantedBy=multi-user.target\n");
  });
});
