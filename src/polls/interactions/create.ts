import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Helpers from "../helpers";
import * as CreatePoll from "../ops/create-poll";
import * as Responses from "../../utils/responses";

export const handle =
  (db: Db) => (source$: Rx.Observable<SlashCommandContext>) =>
    F.pipe(
      source$,
      RxO.flatMap((ctx) =>
        F.pipe(
          CreatePoll.fromContext(db)(ctx),
          TE.chain(Helpers.toResponse(db)),
          Responses.message(ctx),
          TE.mapLeft((err) =>
            console.log("polls/interactions/create.ts", "ERROR", err),
          ),
        )(),
      ),
    );
