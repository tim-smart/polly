import { UI as Components } from "droff-helpers";
import { InteractionCallbackMessage, Snowflake } from "droff/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import Im from "immutable";
import { ObjectId } from "mongodb";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";
import * as Repo from "./repo";
import * as UI from "./ui";

export const buttonId = (poll: Poll, index: number) =>
  `vote_${poll._id}_${index}`;

export const buttonIdDetails = (id: string) =>
  F.pipe(
    O.fromNullable(id.match(/^vote_(.*?)_(\d+)/)),
    O.map(([_, pollID, choice]) => ({
      pollID: new ObjectId(pollID),
      choice: +choice,
    })),
  );

export const resultsId = (poll: Poll) => `results_${poll._id}`;

export const resultsIdDetails = (id: string) =>
  F.pipe(
    O.fromNullable(id.match(/^results_(.*)/)),
    O.map(([_, pollID]) => ({
      pollID: new ObjectId(pollID),
    })),
  );

export const votesMap = (poll: Poll, votes: Vote[]) => {
  const voteUserIds = votes.reduce(
    (counts, vote) =>
      counts.update(vote.option, Im.Set(), (ids) => ids.add(vote.userID)),
    Im.Map<string, Im.Set<Snowflake>>(),
  );

  return poll.choices.reduce(
    (map, choice) =>
      map.set(choice.name, voteUserIds.get(choice.name, Im.Set())),
    Im.OrderedMap<string, Im.Set<Snowflake>>(),
  );
};

export const toResponse = (poll: Poll) =>
  F.pipe(
    Repo.votes(poll._id!),
    RTE.map((votes) => [votes, votesMap(poll, votes)] as const),
    RTE.map(
      ([votes, votesMap]): InteractionCallbackMessage => ({
        embeds: [UI.embed(poll, votes, votesMap)],
        components: Components.grid(UI.buttons(poll)),
      }),
    ),
  );
