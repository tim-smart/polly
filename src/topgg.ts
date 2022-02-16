import * as R from "fp-ts/Reader";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { ClientContext, TopggContext } from "./utils/contexts";

export const postStats = R.asks(
  ({ client, topgg }: ClientContext & TopggContext) =>
    client.guilds$.pipe(
      RxO.auditTime(60000),
      RxO.flatMap((guilds) => {
        const serverCount = guilds.count();
        console.log("[main.ts]", "Updating top.gg serverCount", serverCount);
        return topgg.postStats({
          serverCount,
        });
      }),
      RxO.catchError(() => Rx.EMPTY),
    ),
);
