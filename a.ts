// import { loginPodman } from "./src/ramm.js";

import { createLogger } from "balg";
import { execCommand } from "./src/base/base.ts";

// const logger = createLogger();

// logger.child({ prefix: "/hello" }).error("hello");

const { output } = await execCommand("ls sdsdsd sdsdsd sd sd");
