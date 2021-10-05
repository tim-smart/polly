import { InteractionContext } from "droff-interactions";
import {
  ApplicationCommandInteractionDataOption,
  ApplicationCommandOptionType,
} from "droff/dist/types";
import * as Arr from "fp-ts/Array";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Im from "immutable";

export const findSubCommand =
  (name: string) =>
  ({ interaction }: InteractionContext) =>
    F.pipe(
      O.fromNullable(interaction.data?.options),
      O.chain(
        Arr.findFirst(
          (o: ApplicationCommandInteractionDataOption) =>
            o.type === ApplicationCommandOptionType.SUB_COMMAND &&
            o.name === name,
        ),
      ),
    );

export const isSubCommand = (name: string) =>
  F.flow(findSubCommand(name), O.isSome);

export const subCommandOptions = (name: string) =>
  F.flow(
    findSubCommand(name),
    O.chainNullableK((o) => o.options),
  );

export const optionsMap = (
  options: ApplicationCommandInteractionDataOption[],
) =>
  options.reduce(
    (map, option) => map.set(option.name, option.value),
    Im.Map<string, any>(),
  );
