import { InteractionContext } from "droff-interactions";
import { Interactions } from "droff-helpers";
import * as F from "fp-ts/function";
import * as R from "fp-ts/Reader";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { DbContext } from "../../utils/contexts";
import * as Responses from "../../utils/responses";
import * as Helpers from "../helpers";
import * as ToggleVote from "../ops/toggle-vote";
import * as Repo from "../repo";

export const handle =
  (dbCtx: DbContext) => (source$: Rx.Observable<InteractionContext>) =>
    F.pipe(
      source$,
      RxO.flatMap((i) => run(i)(dbCtx)()),
    );

const run = (ctx: InteractionContext) =>
  F.pipe(
    Interactions.getComponentData(ctx.interaction),
    RTE.fromOption(() => "Could not find custom_id"),

    // Fetch poll from interaction details
    RTE.chain(({ custom_id }) => fetchPoll(custom_id)),

    // Toggle the vote
    RTE.chainFirst(({ poll, choice }) =>
      ToggleVote.run(
        poll,
        poll.choices[choice].name,
        (ctx.member?.user || ctx.user!).id,
      ),
    ),

    // Generate the poll response and send it
    RTE.chain(({ poll }) => Helpers.toResponse(poll)),
    R.map(Responses.update(ctx)),

    // Maybe log errors
    RTE.mapLeft(console.error),
  );

const fetchPoll = (customID: string) =>
  F.pipe(
    Helpers.buttonIdDetails(customID),
    RTE.fromOption(() => "Could not find poll information from button"),
    RTE.bindTo("details"),
    RTE.bind("poll", ({ details: { pollID } }) => Repo.get(pollID)),
    RTE.map(({ details: { choice }, poll }) => ({ poll, choice })),
  );
