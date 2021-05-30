import { Snowflake } from "droff/dist/types";
import * as Arr from "fp-ts/Array";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Db, ObjectId } from "mongodb";
import { Poll } from "../../models/Poll";
import { Vote } from "../../models/Vote";
import * as Repo from "../repo";
import * as R from "remeda";

export type ToggleResult = "add" | "remove" | "fail";

export const run =
  (db: Db) =>
  (poll: Poll) =>
  (option: string) =>
  async (userID: Snowflake): Promise<ToggleResult> => {
    const votes = await Repo.votes(db)(poll._id!);

    return F.pipe(
      votes,
      R.filter((v) => v.userID === userID),
      O.fromPredicate(canToggleVote(poll, option)),
      O.map(actuallyToggle(db)(poll._id!, userID, option)),
      O.getOrElse(() => Promise.resolve<ToggleResult>("fail")),
    );
  };

const canToggleVote = (poll: Poll, choice: string) => (votes: Vote[]) =>
  poll.multiple
    ? true
    : votes.length === 0 || votes.some((v) => v.option === choice);

const actuallyToggle =
  (db: Db) =>
  (pollID: ObjectId, userID: Snowflake, option: string) =>
  (votes: Vote[]): Promise<ToggleResult> =>
    F.pipe(
      votes,
      Arr.findFirst((vote) => vote.option === option),
      O.fold(
        () => Repo.insertVote(db)({ pollID, userID, option }).then(() => "add"),
        (vote) => Repo.deleteVote(db)(vote._id!).then(() => "remove"),
      ),
    );
