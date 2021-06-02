import { Snowflake } from "droff/dist/types";
import * as Arr from "fp-ts/Array";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import { Poll } from "../../models/Poll";
import { Vote } from "../../models/Vote";
import * as Repo from "../repo";

export const run =
  (db: Db) =>
  (poll: Poll) =>
  (option: string) =>
  (userID: Snowflake): TE.TaskEither<string, void> =>
    F.pipe(
      TE.tryCatch(
        () => Repo.userVotes(db)(poll._id!, userID),
        () => "Could not fetch votes",
      ),
      TE.chain(
        actuallyToggle(db)(poll.multiple, {
          pollID: poll._id!,
          userID,
          option,
        }),
      ),
    );

const actuallyToggle =
  (db: Db) => (multiple: boolean, vote: Vote) => (votes: Vote[]) =>
    F.pipe(
      votes,
      Arr.findFirst((v) => v.option === vote.option),
      O.fold(
        () =>
          TE.tryCatch<string, void>(
            () => Repo.insertVote(db)(multiple)(vote).then(),
            () => "Could not add vote",
          ),
        (vote) =>
          TE.tryCatch(
            () => Repo.deleteVote(db)(vote._id!),
            () => "Could not remove vote",
          ),
      ),
    );
