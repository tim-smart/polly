import { Client } from "droff";
import { GlobalCommand, SlashCommandsHelper } from "droff-interactions";
import { ApplicationCommandOptionType } from "droff/dist/types";
import { Db } from "mongodb";
import { toOrdinal, toWords } from "number-to-words";
import * as Rx from "rxjs";
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
    ...[...Array(25 - 3).keys()].map((index) => ({
      type: ApplicationCommandOptionType.STRING,
      name: `choice-${toWords(index + 1)}`,
      description: `The ${toOrdinal(index + 1)} choice a person can vote for`,
      required: index <= 1,
    })),
  ],
};

export const register = (
  commands: SlashCommandsHelper,
  client: Client,
  db: Db,
) =>
  Rx.merge(
    // Poll creation command
    commands
      .global(command, process.env.CREATE_GLOBAL_COMMANDS === "true")
      .pipe(Create.handle(db)),

    // Handle votes
    commands.component(/^vote_/).pipe(Vote.handle(db)),

    // Handle results
    commands.component(/^results_/).pipe(Results.handle(client, db)),
  );
