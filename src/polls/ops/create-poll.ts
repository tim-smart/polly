import { Interactions } from "droff-helpers";
import { InteractionContext } from "droff-interactions";
import {
  ApplicationCommandInteractionDataOption,
  Snowflake,
} from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as R from "fp-ts/Reader";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Choice, Poll } from "../../models/Poll";
import * as Repo from "../repo";

export const fromContext = (ctx: InteractionContext) =>
  F.pipe(
    R.asks(() => pollFromData(ctx)),
    R.map(TE.fromOption(() => "Oops! Could not create the poll.")),
    RTE.chain(Repo.insert),
  );

const pollFromData = (ctx: InteractionContext) =>
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
  F.pipe(Interactions.transformOptions(options), (map) => {
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
