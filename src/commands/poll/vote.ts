import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Db } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Helpers from "./helpers";
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
            (details) => Rx.of([ctx, details] as const)
          )
        )
      ),

      // Get the poll from the repo
      RxO.flatMap(([ctx, { pollID, choice }]) =>
        Rx.zip(Rx.of(ctx), Repo.get(db)(pollID), Rx.of(choice))
      ),

      // Toggle the vote
      RxO.flatMap(([ctx, poll, choiceIndex]) =>
        Repo.toggleVote(db)(poll)(poll.choices[choiceIndex].name)(
          (ctx.member?.user || ctx.user!).id
        ).then((op) => [ctx, poll, op] as const)
      ),

      // Update poll if it wasn't a fail
      RxO.flatMap(([ctx, poll, op]) =>
        op === "fail"
          ? ctx.respond({
              content: "You can only vote on this poll once.",
              flags: 64,
            })
          : Helpers.toResponse(db)(poll).then(ctx.update)
      )
    );
