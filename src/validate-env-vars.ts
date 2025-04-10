import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
});

export const validateEnvVars = () => envSchema.parse(process.env);
