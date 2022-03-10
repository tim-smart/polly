import { Snowflake } from "droff/types";
import * as F from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { ObjectId } from "mongodb";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";
import { DbContext } from "../utils/contexts";
import * as RTEU from "../utils/rte";

export const insert = (poll: Poll) =>
  F.pipe(
    RTEU.tryCatch(
      ({ pollsCollection }: DbContext) => pollsCollection.insertOne(poll),
      () => "Could not insert poll",
    ),
    RTE.map((r) => r.ops[0]),
  );

export const get = (pollId: ObjectId) =>
  F.pipe(
    RTEU.tryCatch(
      ({ pollsCollection }: DbContext) =>
        pollsCollection.findOne({ _id: pollId }),
      (err) => `Could not get poll: ${err}`,
    ),
    RTE.filterOrElse(
      (poll): poll is Poll => poll != null,
      () => "Poll not found",
    ),
  );

export const insertVote = (vote: Vote, multiple: boolean) =>
  F.pipe(
    RTE.ask<DbContext>(),

    multiple
      ? F.identity
      : RTE.chainFirst(() => removePreviousVotes(vote.pollID, vote.userID)),

    RTEU.chainTryCatch(
      ({ votesCollection }) => votesCollection.insertOne(vote),
      () => "Could not insert vote",
    ),

    RTE.map((result) => result.ops[0]),
  );

const removePreviousVotes = (pollID: ObjectId, userID: Snowflake) =>
  RTEU.tryCatch(
    ({ votesCollection }: DbContext) =>
      votesCollection.deleteMany({ pollID, userID }),
    (err) => `Could not remove previous votes from user: ${err}`,
  );

export const deleteVote = (voteId: ObjectId) =>
  RTEU.tryCatch(
    ({ votesCollection }: DbContext) =>
      votesCollection.deleteOne({ _id: voteId }),
    (err) => `Could not delete vote: ${err}`,
  );

export const votes = (pollID: ObjectId) =>
  RTEU.tryCatch(
    ({ votesCollection }: DbContext) =>
      votesCollection.find({ pollID }).toArray(),
    (err) => `Could not find votes: ${err}`,
  );

export const userVotes = (pollID: ObjectId, userID: Snowflake) =>
  RTEU.tryCatch(
    ({ votesCollection }: DbContext) =>
      votesCollection.find({ pollID, userID }).toArray(),
    (err) => `Could not find votes for user: ${err}`,
  );
