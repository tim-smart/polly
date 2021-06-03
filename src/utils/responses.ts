import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import { InteractionApplicationCommandCallbackDatum } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";

export const respond =
  (
    fn: (
      ctx: SlashCommandContext,
      response: InteractionApplicationCommandCallbackDatum,
    ) => Promise<void>,
  ) =>
  (ctx: SlashCommandContext) =>
  (input: TE.TaskEither<string, InteractionApplicationCommandCallbackDatum>) =>
    F.pipe(
      input,
      TE.fold(
        (content) =>
          TE.tryCatch(
            () => ctx.respond({ content, flags: 64 }) as Promise<unknown>,
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
  respond({ ...msg, flags: 64 }),
);
