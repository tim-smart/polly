import { UI } from "droff-helpers";
import {
  ApplicationCommandOption,
  ApplicationCommandOptionType,
  ButtonStyle,
  Embed,
  EmbedField,
  Snowflake,
} from "droff/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import Im from "immutable";
import * as R from "remeda";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";
import * as Helpers from "./helpers";

export const buttons = (poll: Poll) =>
  F.pipe(
    [
      ...poll.choices.map((choice, index) =>
        UI.button({
          custom_id: Helpers.buttonId(poll, index),
          label: choice.name,
        }),
      ),

      // Add view results button to anonymous polls
      ...(poll.anonymous
        ? [
            UI.button({
              custom_id: Helpers.resultsId(poll),
              label: "View results",
              style: ButtonStyle.SECONDARY,
            }),
          ]
        : []),
    ],
    R.chunk(5),
  );

export const embed = (
  poll: Poll,
  votes: Vote[],
  votesMap: Im.OrderedMap<string, Im.Set<Snowflake>>,
  anonymousSummary = false,
): Embed => ({
  title: poll.question,
  description: poll.multiple
    ? "Multiple votes are allowed."
    : "Only one vote per person is allowed.",
  color: 0x99aab5,
  fields:
    poll.anonymous && !anonymousSummary
      ? anonymousFields(votes)
      : summaryFields(votesMap, anonymousSummary),
});

const anonymousFields = (votes: Vote[]): EmbedField[] => [
  {
    name: `Total votes: ${votes.length}`,
    value: "Votes are anonymous",
  },
];

const summaryFields = (
  votesMap: Im.OrderedMap<string, Im.Set<Snowflake>>,
  anonymousSummary = false,
): EmbedField[] =>
  votesMap
    .entrySeq()
    .map(
      ([choice, votes]): EmbedField => ({
        name: `${choice} (${votes.count()})`,
        value: F.pipe(
          votes,
          O.fromPredicate(() => anonymousSummary),
          O.map(() => "Votes are anonymous"),
          O.alt(() => voteSummary(votes)),
          O.getOrElse(() => "No votes"),
        ),
      }),
    )
    .toArray();

export const voteSummary = (votes: Im.Set<Snowflake>) =>
  F.pipe(
    votes,
    O.fromPredicate((v) => !v.isEmpty()),
    O.map((votes) => votes.map((id) => `<@${id}>`).join(", ")),
  );

export const yesNoField = (
  opts: Pick<ApplicationCommandOption, "name" | "description" | "required">,
): ApplicationCommandOption => ({
  ...opts,
  type: ApplicationCommandOptionType.STRING,
  choices: [
    {
      name: "no",
      value: "false",
    },
    {
      name: "yes",
      value: "true",
    },
  ],
});
