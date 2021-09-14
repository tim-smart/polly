import { SlashCommandContext } from "droff-interactions";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Responses from "../../utils/responses";
import * as Helpers from "../helpers";
import * as ToggleVote from "../ops/toggle-vote";
import * as Repo from "../repo";

export const handle =
  (db: Db) => (source$: Rx.Observable<SlashCommandContext>) =>
    F.pipe(source$, RxO.flatMap(run(db)));

const run = (db: Db) => (ctx: SlashCommandContext) =>
  F.pipe(
    // Fetch poll from interaction details
    fetchPoll(db)(ctx.interaction.data!.custom_id || ""),

    // Toggle the vote
    TE.chainFirst(({ poll, choice }) =>
      ToggleVote.run(db)(poll)(poll.choices[choice].name)(
        (ctx.member?.user || ctx.user!).id,
      ),
    ),

    // Generate the poll response
    TE.chain(({ poll }) => Helpers.toResponse(db)(poll)),

    // Send the update
    Responses.update(ctx),

    // Maybe log errors
    TE.mapLeft(console.error),
  )();

const fetchPoll = (db: Db) => (customID: string) =>
  F.pipe(
    Helpers.buttonIdDetails(customID),
    TE.fromOption(() => "Could not find poll information from button"),
    TE.chain(({ pollID, choice }) =>
      F.pipe(
        Repo.get(db)(pollID),
        TE.map((poll) => ({ poll, choice })),
      ),
    ),
  );
