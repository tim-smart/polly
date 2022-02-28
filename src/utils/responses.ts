import { InteractionContext } from "droff-interactions";
import {
  InteractionCallbackDatum,
  InteractionCallbackMessage,
  MessageFlag,
} from "droff/dist/types";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export const respond =
  (
    fn: (
      ctx: InteractionContext,
      response: InteractionCallbackMessage,
    ) => Promise<void>,
  ) =>
  (ctx: InteractionContext) =>
  (input: TE.TaskEither<string, InteractionCallbackMessage>) =>
    F.pipe(
      input,
      TE.fold(
        (content) =>
          TE.tryCatch(
            () =>
              ctx.respond({
                content,
                flags: MessageFlag.EPHEMERAL,
              }) as Promise<unknown>,
            () => "Could not respond with error",
          ),
        (msg) =>
          TE.tryCatch(
            () => fn(ctx, msg),
            () => "Could not respond",
          ),
      ),
    );

export const update = respond(({ update }, msg) => update(msg));
export const message = respond(({ respond }, msg) => respond({ ...msg }));
export const ephemeral = respond(({ respond }, msg) =>
  respond({ ...msg, flags: MessageFlag.EPHEMERAL }),
);
