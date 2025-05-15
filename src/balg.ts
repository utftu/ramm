import { ConsoleProviderDev, createLogger } from "balg";

export const logger = createLogger({ providers: [new ConsoleProviderDev()] });
