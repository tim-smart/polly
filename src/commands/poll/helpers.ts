import {
  Component,
  InteractionApplicationCommandCallbackDatum,
} from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Im from "immutable";
import { Db, ObjectId } from "mongodb";
import * as R from "remeda";
import { Poll } from "../../models/Poll";
import * as Components from "../../utils/components";
import * as Repo from "./repo";

export const buttonId = (poll: Poll, index: number) =>
  `vote_${poll._id}_${index}`;

export const buttonIdDetails = (id: string) =>
  F.pipe(
    O.fromNullable(id.match(/^vote_(.*?)_(\d+)/)),
    O.map(([_, pollID, choice]) => ({
      pollID: new ObjectId(pollID),
      choice: +choice,
    }))
  );

export const buttons = (poll: Poll): Component[][] =>
  F.pipe(
    poll.choices.map((choice, index) =>
      Components.button({
        custom_id: buttonId(poll, index),
        label: choice.name,
      })
    ),
    R.chunk(5)
  );

export const toResponse =
  (db: Db) =>
  async (poll: Poll): Promise<InteractionApplicationCommandCallbackDatum> => {
    const counts = await Repo.votesMap(db)(poll._id!);
    const votes = poll.choices.reduce(
      (map, choice) => map.set(choice.name, counts.get(choice.name, 0)),
      Im.OrderedMap<string, number>()
    );

    return {
      content: JSON.stringify(votes.toJSON()),
      components: Components.grid(buttons(poll)),
    };
  };
