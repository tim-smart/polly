import { Interactions } from "droff-helpers";
import { InteractionContext } from "droff-interactions";
import {
  ApplicationCommandInteractionDataOption,
  Snowflake,
} from "droff/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { Choice, Poll } from "../../models/Poll";
import * as Repo from "../repo";

export const fromContext = (ctx: InteractionContext) =>
  F.pipe(
    pollFromData(ctx),
    RTE.fromOption(() => "Oops! Could not create the poll."),
    RTE.chain(Repo.insert),
  );

const pollFromData = (ctx: InteractionContext) =>
  pollFromOptions(
    ctx.interaction.id,
    (ctx.member?.user || ctx.user!).id,
    Interactions.options(ctx.interaction),
  );

const pollFromOptions = (
  interactionID: Snowflake,
  ownerID: Snowflake,
  options: ApplicationCommandInteractionDataOption[],
): O.Option<Poll> =>
  F.pipe(
    options
      .filter(({ name }) => name.startsWith("choice-"))
      .map(({ value }): Choice => ({ name: value! })),
    O.fromPredicate((choices) => choices.length >= 2),
    O.map((choices) => {
      const poll = Interactions.transformOptions(options)
        .filter((_, key) => !key.startsWith("choice-"))
        .toJSON();

      return {
        ...poll,
        interactionID,
        ownerID,
        multiple: poll.multiple === "true",
        anonymous: poll.anonymous === "true",
        choices,
      } as Poll;
    }),
  );
