import { Client, SlashCommandsHelper } from "droff";
import {
  GuildCommandCreate,
  SlashCommandContext,
} from "droff/dist/slash-commands/factory";
import { ApplicationCommandOptionType } from "droff/dist/types";
import * as F from "fp-ts/function";
import { Db } from "mongodb";
import { toOrdinal, toWords } from "number-to-words";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Helpers from "./helpers";
import * as CreatePoll from "./ops/create-poll";
import * as Results from "./results";
import * as Vote from "./vote";

const command: GuildCommandCreate = {
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
) => {
  // Poll creation command
  commands.guild(command).pipe(handle(db)).subscribe();

  // Handle votes
  commands
    .component(/^vote_/)
    .pipe(Vote.handle(db))
    .subscribe();

  // Handle results
  commands
    .component(/^results_/)
    .pipe(Results.handle(client, db))
    .subscribe();
};

const handle = (db: Db) => (source$: Rx.Observable<SlashCommandContext>) =>
  F.pipe(
    source$,
    RxO.flatMap((ctx) =>
      CreatePoll.fromContext(db)(ctx)
        .then(Helpers.toResponse(db))
        .then((msg) => ctx.respond(msg))
        .catch((err) =>
          ctx.respond({
            content: err.message,
            flags: 64,
          }),
        ),
    ),
  );
