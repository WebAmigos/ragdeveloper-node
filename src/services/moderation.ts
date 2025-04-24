import path from "path";

import dotenvFlow from "dotenv-flow";
import OpenAI from "openai";

import { logger } from "./logger";

dotenvFlow.config({
  path: path.resolve(process.cwd()),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_MODERATION_KEY }); // default: // OPENAI_API_KEY

export const moderation = async (userPrompt: string) => {
  return await openai.moderations.create({
    model: "omni-moderation-latest",
    input: userPrompt,
  });
};
