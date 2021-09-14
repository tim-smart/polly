import { UI as Components } from "droff-helpers";
import { InteractionCallbackDatum, Snowflake } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/Option";
import * as Im from "immutable";
import { Db, ObjectId } from "mongodb";
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

export const toResponse = (db: Db) => (poll: Poll) =>
  F.pipe(
    Repo.votes(db)(poll._id!),
    TE.map((votes) => [votes, votesMap(poll, votes)] as const),
    TE.map(
      ([votes, votesMap]): InteractionCallbackDatum => ({
        embeds: [UI.embed(poll, votes, votesMap)],
        components: Components.grid(UI.buttons(poll)),
      }),
    ),
  );
