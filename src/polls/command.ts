import { GlobalCommand } from "droff-interactions";
import { ApplicationCommandOptionType } from "droff/dist/types";
import { toOrdinal, toWords } from "number-to-words";
import * as Rx from "rxjs";
import {
  CacheContext,
  ClientContext,
  CommandContext,
  DbContext,
} from "../utils/contexts";
import * as Create from "./interactions/create";
import * as Results from "./interactions/results";
import * as Vote from "./interactions/vote";
import { yesNoField } from "./ui";

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
    yesNoField({
      name: "multiple",
      description: "Allow people to vote for more than one option",
      required: true,
    }),
    yesNoField({
      name: "anonymous",
      description: "Only show results to the poll creator and admins",
      required: true,
    }),
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

export const register = (
  ctx: DbContext & CommandContext & ClientContext & CacheContext,
) => {
  const { commands } = ctx;

  return Rx.merge(
    // Poll creation command
    commands
      .global(command, process.env.CREATE_GLOBAL_COMMANDS === "true")
      .pipe(Create.handle(ctx)),

    // Handle votes
    commands.component(/^vote_/).pipe(Vote.handle(ctx)),

    // Handle results
    commands.component(/^results_/).pipe(Results.handle(ctx)),
  );
};
