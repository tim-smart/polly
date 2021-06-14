import { SnowflakeMap } from "droff/dist/caches/resources";
import {
  Guild,
  GuildMember,
  Interaction,
  PermissionFlag,
  Role,
} from "droff/dist/types";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import { Poll } from "../../models/Poll";
import * as Helpers from "../helpers";
import * as Repo from "../repo";
import * as Ui from "../ui";
import { Permissions } from "droff-helpers";

export const run =
  (db: Db) =>
  (poll: Poll) =>
  ({ member }: Interaction, guild: Guild, roles: SnowflakeMap<Role>) =>
    F.pipe(
      member!,
      TE.fromPredicate(
        hasPermission(poll, guild, roles),
        () => "You need to be the poll owner or an admin to view the results.",
      ),
      TE.chain(
        TE.tryCatchK(
          () => Repo.votes(db)(poll._id!),
          () => "Could not fetch votes",
        ),
      ),
      TE.map((votes) => [votes, Helpers.votesMap(poll, votes)] as const),
      TE.map(([votes, votesMap]) => Ui.embed(poll, votes, votesMap, true)),
    );

const hasAdmin = Permissions.has(PermissionFlag.ADMINISTRATOR);

const hasPermission =
  (poll: Poll, guild: Guild, roles: SnowflakeMap<Role>) =>
  (member: GuildMember) => {
    const userID = member!.user!.id;
    if (poll.ownerID === userID) return true;

    const isAdmin = member.roles
      .map((id) => roles.get(id)!)
      .some((role) => hasAdmin(role.permissions));
    const isOwner = guild.owner_id === userID;

    return isAdmin || isOwner;
  };
