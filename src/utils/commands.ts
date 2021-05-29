import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import * as O from "fp-ts/Option";
import * as Im from "immutable";
import * as F from "fp-ts/function";
import * as Arr from "fp-ts/Array";
import {
  ApplicationCommandInteractionDataOption,
  ApplicationCommandOptionType,
} from "droff/dist/types";

export const findSubCommand =
  (name: string) =>
  ({ interaction }: SlashCommandContext) =>
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
