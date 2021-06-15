import { Snowflake } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Db, ObjectId } from "mongodb";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";

const collection = (db: Db) => db.collection<Poll>("polls");
const votesCollection = (db: Db) => db.collection<Vote>("votes");

export const insert = (db: Db) => {
  const coll = collection(db);
  return F.flow(
    TE.tryCatchK(
      (poll: Poll) => coll.insertOne(poll),
      () => "Could not insert poll",
    ),
    TE.map((result) => result.ops[0]),
  );
};

export const get = (db: Db) => {
  const coll = collection(db);

  return F.flow(
    TE.tryCatchK(
      (pollId: ObjectId) => coll.findOne({ _id: pollId }),
      (err) => `Could not get poll: ${err}`,
    ),
    TE.map(O.fromNullable),
    TE.chain(TE.fromOption(() => "Poll not found")),
  );
};

export const insertVote = (db: Db) => {
  const coll = votesCollection(db);

  return (multiple: boolean) => (vote: Vote) =>
    F.pipe(
      TE.right(vote),

      TE.chainFirst(
        TE.tryCatchK(
          (vote: Vote) =>
            multiple
              ? coll
                  .deleteMany({ pollID: vote.pollID, userID: vote.userID })
                  .then(() => {})
              : Promise.resolve(),
          (err) => `Could not remove previous votes from user: ${err}`,
        ),
      ),

      TE.chain(
        TE.tryCatchK(
          (vote) => coll.insertOne(vote),
          () => "Could not insert vote",
        ),
      ),

      TE.map((result) => result.ops[0]),
    );
};

export const deleteVote = (db: Db) => {
  const coll = votesCollection(db);

  return F.flow(
    TE.tryCatchK(
      (voteId: ObjectId) => coll.deleteOne({ _id: voteId }),
      (err) => `Could not delete vote: ${err}`,
    ),
  );
};

export const votes = (db: Db) => {
  const coll = votesCollection(db);

  return F.flow(
    TE.tryCatchK(
      (pollID: ObjectId) => coll.find({ pollID }).toArray(),
      (err) => `Could not find votes: ${err}`,
    ),
  );
};

export const userVotes = (db: Db) => {
  const coll = votesCollection(db);

  return F.flow(
    TE.tryCatchK(
      (pollID: ObjectId, userID: Snowflake) =>
        coll.find({ pollID, userID }).toArray(),
      (err) => `Could not find votes for user: ${err}`,
    ),
  );
};
