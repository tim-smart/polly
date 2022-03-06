import { InteractionContext } from "droff-interactions";
import {
  InteractionCallbackDatum,
  InteractionCallbackMessage,
  InteractionCallbackType,
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
              ctx.respond(InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE)({
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

export const update = respond(({ respond }, msg) =>
  respond(InteractionCallbackType.UPDATE_MESSAGE)(msg),
);
export const message = respond(({ respond }, msg) =>
  respond(InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE)({ ...msg }),
);
export const ephemeral = respond(({ respond }, msg) =>
  respond(InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE)({
    ...msg,
    flags: MessageFlag.EPHEMERAL,
  }),
);
