import { Snowflake } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Arr from "fp-ts/Array";
import * as Im from "immutable";
import { Collection, Db, ObjectId } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { Poll } from "../../models/Poll";
import { Vote } from "../../models/Vote";

const collection = (db: Db) => db.collection<Poll>("polls");
const votesCollection = (db: Db) => db.collection<Vote>("votes");

export const insert =
  (db: Db) =>
  (poll: Poll): Promise<Poll> =>
    F.pipe(collection(db), (c) => c.insertOne(poll)).then(
      (result) => result.ops[0]
    );

export const get = (db: Db) => (pollId: ObjectId) => {
  const coll = collection(db);
  return F.pipe(
    Rx.from(coll.findOne({ _id: pollId })),
    RxO.flatMap((poll) => (poll ? Rx.of(poll) : Rx.EMPTY))
  );
};

export const votesMap = (db: Db) => (pollID: ObjectId) =>
  F.pipe(
    votesCollection(db),
    (c) => Rx.from(c.find({ pollID }).toArray()),
    RxO.flatMap(F.identity),
    RxO.reduce(
      (counts, vote) =>
        counts.update(vote.option, Im.Set(), (ids) => ids.add(vote.userID)),
      Im.Map<string, Im.Set<Snowflake>>()
    ),
    (o) => Rx.lastValueFrom(o)
  );

export type ToggleResult = "add" | "remove" | "fail";

export const toggleVote =
  (db: Db) =>
  (poll: Poll) =>
  (option: string) =>
  async (userID: Snowflake): Promise<ToggleResult> => {
    const coll = votesCollection(db);
    const votes = await coll.find({ pollID: poll._id!, userID }).toArray();

    return F.pipe(
      votes,
      O.fromPredicate(canToggleVote(poll, option)),
      O.map(actuallyToggle(coll, poll._id!, userID, option)),
      O.getOrElse(() => Promise.resolve<ToggleResult>("fail"))
    );
  };

const canToggleVote = (poll: Poll, choice: string) => (votes: Vote[]) =>
  poll.multiple
    ? true
    : votes.length === 0 || votes.some((v) => v.option === choice);

const actuallyToggle =
  (
    coll: Collection<Vote>,
    pollID: ObjectId,
    userID: Snowflake,
    option: string
  ) =>
  (votes: Vote[]): Promise<ToggleResult> =>
    F.pipe(
      votes,
      Arr.findFirst((vote) => vote.option === option),
      O.fold(
        () => coll.insertOne({ pollID, userID, option }).then(() => "add"),
        (vote) => coll.deleteOne({ _id: vote._id! }).then(() => "remove")
      )
    );
