import { InteractionContext } from "droff-interactions";
import * as F from "fp-ts/function";
import * as R from "fp-ts/Reader";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { DbContext } from "../../utils/contexts";
import * as Responses from "../../utils/responses";
import * as Helpers from "../helpers";
import * as CreatePoll from "../ops/create-poll";

export const handle = R.asks(
  (ctx: DbContext) => (source$: Rx.Observable<InteractionContext>) =>
    F.pipe(
      source$,
      RxO.flatMap((i) => run(i)(ctx)()),
    ),
);

const run = (ctx: InteractionContext) =>
  F.pipe(
    CreatePoll.fromContext(ctx),
    RTE.chain(Helpers.toResponse),
    R.map(Responses.message(ctx)),
    RTE.mapLeft((err) =>
      console.log("[polls/interactions/create.ts]", "ERROR", err),
    ),
  );
