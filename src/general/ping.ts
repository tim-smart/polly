import { InteractionCallbackType, MessageFlag } from "droff/types";
import * as RxO from "rxjs/operators";
import { ClientContext, InteractionsContext } from "../utils/contexts";

export const register = ({
  client,
  ix,
}: ClientContext & InteractionsContext) => {
  const latency$ = client.gateway.shards$.pipe(
    RxO.mergeMap((s) => s.latency$),
    RxO.startWith(-1),
    RxO.shareReplay(1),
  );

  return ix
    .global(
      {
        name: "ping",
        description: "Get latency information",
      },
      true,
    )
    .pipe(
      RxO.withLatestFrom(latency$),
      RxO.mergeMap(([{ respond }, latency]) =>
        respond(InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE)({
          content: `Pong! Latency: ${latency < 0 ? "N/A" : `${latency}ms`}`,
          flags: MessageFlag.EPHEMERAL,
        }),
      ),
    );
};
