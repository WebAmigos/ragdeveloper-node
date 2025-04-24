import path from "path";

import { ZodError } from "zod";
import dotenvFlow from "dotenv-flow";

import { validateEnvVars } from "./validate-env-vars";
import { logger, moderation } from "./services";

dotenvFlow.config({
  path: path.resolve(process.cwd()),
});

try {
  validateEnvVars();
} catch (error) {
  if (error instanceof ZodError) {
    console.error("Invalid env variables");
    process.exit(1);
  }
}

const userPrompt = "Co jest stolicą Polski?";

const run = async () => {
  // 1. Moderation
  const moderationResult = await moderation(userPrompt);

  logger.info({ moderationResult });
};

run();
