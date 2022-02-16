import { Client } from "droff";
import { GlobalCommand, InteractionsHelper } from "droff-interactions";
import { ApplicationCommandOptionType } from "droff/dist/types";
import { Db } from "mongodb";
import { toOrdinal, toWords } from "number-to-words";
import * as Rx from "rxjs";
import { ClientContext, CommandContext, DbContext } from "../utils/contexts";
import * as Create from "./interactions/create";
import * as Results from "./interactions/results";
import * as Vote from "./interactions/vote";

const command: GlobalCommand = {
  name: "poll",
  description: "Creates a new poll",
  options: [
    {
      type: ApplicationCommandOptionType.STRING,
      name: "question",
      description: "The question/title for the poll",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.STRING,
      name: "multiple",
      description: "Allow people to vote for more than one option",
      required: true,
      choices: [
        {
          name: "no",
          value: "false",
        },
        {
          name: "yes",
          value: "true",
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.STRING,
      name: "anonymous",
      description: "Only show results to the poll creator and admins",
      required: true,
      choices: [
        {
          name: "no",
          value: "false",
        },
        {
          name: "yes",
          value: "true",
        },
      ],
    },
    ...Array(25 - 3)
      .fill(0)
      .map((_, index) => ({
        type: ApplicationCommandOptionType.STRING,
        name: `choice-${toWords(index + 1)}`,
        description: `The ${toOrdinal(index + 1)} choice a person can vote for`,
        required: index <= 1,
      })),
  ],
};

export const register = (ctx: DbContext & CommandContext & ClientContext) =>
  Rx.merge(
    // Poll creation command
    ctx.commands
      .global(command, process.env.CREATE_GLOBAL_COMMANDS === "true")
      .pipe(Create.handle(ctx)),

    // Handle votes
    ctx.commands.component(/^vote_/).pipe(Vote.handle(ctx)),

    // Handle results
    ctx.commands.component(/^results_/).pipe(Results.handle(ctx)),
  );
