import { pipe } from "fp-ts/lib/function";
import * as R from "fp-ts/Reader";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { CacheContext, TopggContext } from "./utils/contexts";

export const postStats = R.asks(
  ({ topgg, guildsCache }: TopggContext & CacheContext) =>
    pipe(
      Rx.merge(Rx.of(0), guildsCache.watch$),
      RxO.auditTime(60000),
      RxO.flatMap(() => guildsCache.size()),
      RxO.flatMap((serverCount) => {
        console.log("[main.ts]", "Updating top.gg serverCount", serverCount);
        return topgg.postStats({
          serverCount,
        });
      }),
      RxO.catchError(() => Rx.EMPTY),
    ),
);
