import path from "path";
import { ZodError } from "zod";
import { validateEnvVars } from "./validate-env-vars";
import dotenvFlow from "dotenv-flow";

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

console.log("Hello World!");
