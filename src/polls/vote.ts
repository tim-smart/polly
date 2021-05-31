import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Helpers from "./helpers";
import * as ToggleVote from "./ops/toggle-vote";
import * as Repo from "./repo";

export const handle =
  (db: Db) => (source$: Rx.Observable<SlashCommandContext>) =>
    F.pipe(
      source$,

      // Extract poll information from button ID
      RxO.flatMap((ctx) =>
        F.pipe(
          Helpers.buttonIdDetails(ctx.interaction.data!.custom_id),
          O.fold(
            () => Rx.EMPTY,
            (details) => Rx.of([ctx, details] as const),
          ),
        ),
      ),

      // Get the poll from the repo
      RxO.flatMap(([ctx, { pollID, choice }]) =>
        Rx.zip(Rx.of(ctx), Repo.get(db)(pollID), Rx.of(choice)),
      ),

      // Toggle the vote
      RxO.flatMap(([ctx, poll, choiceIndex]) =>
        F.pipe(
          ToggleVote.run(db)(poll)(poll.choices[choiceIndex].name)(
            (ctx.member?.user || ctx.user!).id,
          ),
          TE.chain(() => Helpers.toResponse(db)(poll)),
          TE.chain(TE.tryCatchK(ctx.update, () => "Could not update poll")),
          TE.orElse(
            TE.tryCatchK(
              (content) =>
                ctx.respond({
                  content,
                  flags: 64,
                }),
              (err) => `Could not repond: ${err}`,
            ),
          ),
        )(),
      ),

      // Maybe log errors
      RxO.tap(E.foldW(console.error, () => {})),
    );
