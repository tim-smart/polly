import { SlashCommandContext } from "droff-interactions";
import {
  ApplicationCommandInteractionDataOption,
  Snowflake,
} from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import { Choice, Poll } from "../../models/Poll";
import * as Commands from "../../utils/commands";
import * as Repo from "../repo";

export const fromContext = (db: Db) => (ctx: SlashCommandContext) =>
  F.pipe(
    pollFromData(ctx),
    TE.fromPredicate(O.isSome, () => "Oops! Could not create the poll."),
    TE.chain(
      TE.tryCatchK(
        (poll) => Repo.insert(db)(poll.value),
        () => "Could not insert poll.",
      ),
    ),
  );

const pollFromData = (ctx: SlashCommandContext) =>
  F.pipe(
    O.fromNullable(ctx.interaction.data),
    O.map(({ options }) =>
      pollFromOptions(
        ctx.interaction.id,
        (ctx.member?.user || ctx.user!).id,
        options!,
      ),
    ),
  );

const pollFromOptions = (
  interactionID: Snowflake,
  ownerID: Snowflake,
  options: ApplicationCommandInteractionDataOption[],
): Poll =>
  F.pipe(Commands.optionsMap(options), (map) => {
    const choices = options
      .filter(({ name }) => name.startsWith("choice-"))
      .map(({ value }): Choice => ({ name: value! }));

    const poll = map.filter((_, key) => !key.startsWith("choice-")).toJSON();

    return {
      ...poll,
      interactionID,
      ownerID,
      multiple: poll.multiple === "true",
      anonymous: poll.anonymous === "true",
      choices,
    } as Poll;
  });
