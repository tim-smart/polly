import { SlashCommandContext } from "droff";
import * as E from "fp-ts/Either";
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
    F.pipe(
      source$,

      RxO.flatMap((ctx) =>
        F.pipe(
          // Fetch poll from interaction details
          fetchPoll(db)(ctx),

          // Toggle the vote and generate updated poll
          TE.chain(({ poll, choice }) =>
            F.pipe(
              ToggleVote.run(db)(poll)(poll.choices[choice].name)(
                (ctx.member?.user || ctx.user!).id,
              ),
              TE.chain(() => Helpers.toResponse(db)(poll)),
            ),
          ),

          // Send the update
          Responses.update(ctx),
        )(),
      ),

      // Maybe log errors
      RxO.tap(E.mapLeft(console.error)),
    );

const fetchPoll = (db: Db) => (ctx: SlashCommandContext) =>
  F.pipe(
    Helpers.buttonIdDetails(ctx.interaction.data!.custom_id),
    TE.fromOption(() => "Could not find poll information from button"),
    TE.chain(({ pollID, choice }) =>
      F.pipe(
        TE.tryCatch(
          () => Repo.get(db)(pollID),
          () => "Could not load poll from repository",
        ),
        TE.chain(TE.fromOption(() => "Poll not found")),
        TE.map((poll) => ({ poll, choice })),
      ),
    ),
  );
