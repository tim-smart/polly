import { Snowflake } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Db, ObjectId } from "mongodb";
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
  return coll.findOne({ _id: pollId }).then(O.fromNullable);
};

export const insertVote =
  (db: Db) => (multiple: boolean) => async (vote: Vote) => {
    const coll = votesCollection(db);

    if (!multiple) {
      await coll.deleteMany({ pollID: vote.pollID, userID: vote.userID });
    }

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

export const userVotes = (db: Db) => (pollID: ObjectId, userID: Snowflake) => {
  const coll = votesCollection(db);
  return coll.find({ pollID, userID }).toArray();
};
