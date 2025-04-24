import path from "path";

import { z, ZodError } from "zod";
import dotenvFlow from "dotenv-flow";
import { ChatOpenAI } from "@langchain/openai";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

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

type Person = {
  name: string;
  height_in_meters: number;
};

type People = {
  people: Person[];
};

const userPrompt = "Co jest stolicą Polski?";

// const userPrompt = "Co jest stolicą?";
//  Response: Stolicą jest miasto, które pełni funkcję głównego ośrodka administracyjnego danego kraju lub regionu. W stolicy zazwyczaj znajdują się siedziby władz państwowych, takie jak parlament, pałac prezydencki czy ministerstwa. Przykłady stolic to Warszawa w Polsce, Berlin w Niemczech czy Paryż we Francji. Jeśli masz na myśli konkretny kraj, mogę podać jego stolicę.

// const userPrompt = "Tell me a joke about dogs";

const run = async () => {
  // 1. Moderation
  const moderationResult = await moderation(userPrompt);

  if (moderationResult.results[0].flagged) {
    logger.error("Moderation fail!");
    process.exit(1);
  }

  // 2.
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const joke = z.object({
    setup: z.string().describe("The setup of the joke"),
    punchline: z.string().describe("The punchline to the joke"),
    rating: z
      .number()
      // .optional()
      .describe("How funny the joke is, from 1 to 10"),
  });

  // const structuredLlm = model.withStructuredOutput(joke);
  // const structuredLlm = model.invoke();

  // const result = await structuredLlm.invoke("Tell me a joke about dogs");
  const result = await model.invoke(userPrompt);

  logger.info(`Response: ${result.content}`);

  const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
{{ people: [{{ name: "string", height_in_meters: "number" }}] }}

Where people is an array of objects, each with a name and height_in_meters field.
`;

  const parser = new JsonOutputParser<People>();

  const prompt = await ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer the user query. Wrap the output in `json` tags\n{format_instructions}",
    ],
    ["human", "{query}"],
  ]).partial({
    format_instructions: formatInstructions,
  });

  // const query = "Anna is 23 years old and she is 6 feet tall";
  // const query = userPrompt;

  const query = "Anna is 23 years old and she is 6 feet tall";

  logger.info(await prompt.format({ query }));

  // const chain = prompt.pipe(model);
  const chain = prompt.pipe(model).pipe(parser);

  const chainResult = await chain.invoke({ query });
  logger.info(chainResult);

  const jokePrompt = ChatPromptTemplate.fromTemplate(
    "opowiedz mi żart o {topic}"
  );

  const jokeChain = jokePrompt.pipe(model).pipe(new StringOutputParser());
  const jokeResult = await jokeChain.invoke({ topic: "Polakach" });
  logger.info({ jokeResult });
};

run();
