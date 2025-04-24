import pino from "pino";
import pretty from "pino-pretty";

const streams = [];

streams.push({
  stream: pretty({
    colorize: true,
  }),
});

export const logger = pino(
  {
    level: "debug",
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME,
    },
  },
  streams.length ? pino.multistream(streams) : pino.destination()
);

logger.info("Logger initialized");
