import * as F from "fp-ts/function";
import { Db, ObjectId } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";

const collection = (db: Db) => db.collection<Poll>("polls");
const votesCollection = (db: Db) => db.collection<Vote>("votes");

export const insert =
  (db: Db) =>
  (poll: Poll): Promise<Poll> =>
    F.pipe(collection(db), (c) => c.insertOne(poll)).then(
      (result) => result.ops[0],
    );

export const get = (db: Db) => (pollId: ObjectId) => {
  const coll = collection(db);
  return F.pipe(
    Rx.from(coll.findOne({ _id: pollId })),
    RxO.flatMap((poll) => (poll ? Rx.of(poll) : Rx.EMPTY)),
  );
};

export const insertVote = (db: Db) => async (vote: Vote) => {
  const coll = votesCollection(db);
  const result = await coll.insertOne(vote);
  return result.ops[0];
};

export const deleteVote = (db: Db) => async (voteId: ObjectId) => {
  const coll = votesCollection(db);
  await coll.deleteOne({ _id: voteId });
};

export const votes = (db: Db) => (pollID: ObjectId) => {
  const coll = votesCollection(db);
  return coll.find({ pollID }).toArray();
};
