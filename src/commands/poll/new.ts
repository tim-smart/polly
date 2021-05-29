import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  ApplicationCommandInteractionDataOption,
  ApplicationCommandOption,
  ApplicationCommandOptionType,
  Snowflake,
} from "droff/dist/types";
import { Db } from "mongodb";
import { toOrdinal, toWords } from "number-to-words";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Commands from "../../utils/commands";
import { Choice, Poll } from "../../models/Poll";
import * as Repo from "./repo";
import * as Helpers from "./helpers";

export const command: ApplicationCommandOption = {
  type: ApplicationCommandOptionType.SUB_COMMAND,
  name: "new",
  description: "Creates a new poll",
  options: [
    {
      type: ApplicationCommandOptionType.STRING,
      name: "question",
      description: "The question/title for the poll",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.BOOLEAN,
      name: "multiple",
      description: "Allow people to vote for more than one option",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.BOOLEAN,
      name: "anonymous",
      description: "Allow people to vote for more than one option",
      required: true,
    },
    ...[...Array(25 - 3).keys()].map((index) => ({
      type: ApplicationCommandOptionType.STRING,
      name: `choice-${toWords(index + 1)}`,
      description: `The ${toOrdinal(index + 1)} choice a person can vote for`,
      required: index <= 1,
    })),
  ],
};

export const handle =
  (db: Db) => (source$: Rx.Observable<SlashCommandContext>) =>
    F.pipe(
      source$,
      RxO.flatMap((ctx) =>
        createPollFromContext(db)(ctx)
          .then(Helpers.toResponse(db))
          .then((msg) => ctx.respond(msg))
          .catch(() =>
            ctx.respond({ content: "Oops! Could not create the poll." })
          )
      )
    );

const createPollFromContext = (db: Db) => (ctx: SlashCommandContext) =>
  F.pipe(
    pollFromContext(ctx),
    O.fold(
      () => Promise.reject(ctx),
      (poll) => Repo.insert(db)(poll)
    )
  );

const pollFromContext = (ctx: SlashCommandContext) =>
  F.pipe(
    Commands.findSubCommand("new")(ctx),
    O.map(({ options }) =>
      pollFromOptions(
        ctx.interaction.id,
        (ctx.member?.user || ctx.user!).id,
        options!
      )
    )
  );

const pollFromOptions = (
  interactionID: Snowflake,
  ownerID: Snowflake,
  options: ApplicationCommandInteractionDataOption[]
): Poll =>
  F.pipe(Commands.optionsMap(options), (map) => {
    const choices = map
      .filter((_, key) => key.startsWith("choice-"))
      .valueSeq()
      .map((name): Choice => ({ name }))
      .toArray();

    const poll = map.filter((_, key) => !key.startsWith("choice-")).toJS();

    return {
      ...poll,
      interactionID,
      ownerID,
      choices,
    } as Poll;
  });
