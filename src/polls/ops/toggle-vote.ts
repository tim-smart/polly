import { Snowflake } from "droff/types";
import * as Arr from "fp-ts/Array";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { Poll } from "../../models/Poll";
import { Vote } from "../../models/Vote";
import { DbContext } from "../../utils/contexts";
import * as Repo from "../repo";

export const run = (poll: Poll, option: string, userID: Snowflake) =>
  F.pipe(
    Repo.userVotes(poll._id!, userID),
    RTE.chain(
      actuallyToggle(poll.multiple, {
        pollID: poll._id!,
        userID,
        option,
      }),
    ),
  );

const actuallyToggle =
  (multiple: boolean, vote: Vote) =>
  (votes: Vote[]): RTE.ReaderTaskEither<DbContext, string, unknown> =>
    F.pipe(
      votes,
      Arr.findFirst((v) => v.option === vote.option),
      O.foldW(
        () => Repo.insertVote(vote, multiple),
        (vote) => Repo.deleteVote(vote._id!),
      ),
    );
