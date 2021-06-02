import { Api } from "@top-gg/sdk";
import { Client } from "droff";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";

export const postStats$ = (client: Client, topgg: Api) =>
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
  );
