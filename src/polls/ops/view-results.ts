import { Permissions } from "droff-helpers";
import {
  Guild,
  GuildMember,
  Interaction,
  PermissionFlag,
  Role,
} from "droff/dist/types";
import * as F from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { Poll } from "../../models/Poll";
import * as Helpers from "../helpers";
import * as Repo from "../repo";
import * as Ui from "../ui";

export interface RunOpts {
  poll: Poll;
  interaction: Interaction;
  guild: Guild;
  roles: ReadonlyMap<string, Role>;
}

export const run = ({ poll, interaction: { member }, guild, roles }: RunOpts) =>
  F.pipe(
    member!,
    RTE.fromPredicate(
      hasPermission(poll, guild, roles),
      () => "You need to be the poll owner or an admin to view the results.",
    ),
    RTE.chain(() => Repo.votes(poll._id!)),
    RTE.map((votes) => [votes, Helpers.votesMap(poll, votes)] as const),
    RTE.map(([votes, votesMap]) => Ui.embed(poll, votes, votesMap, true)),
  );

const hasAdmin = Permissions.has(PermissionFlag.ADMINISTRATOR);

const hasPermission =
  (poll: Poll, guild: Guild, roles: ReadonlyMap<string, Role>) =>
  (member: GuildMember) => {
    const userID = member!.user!.id;
    if (poll.ownerID === userID) return true;

    const isAdmin = member.roles
      .map((id) => roles.get(id)!)
      .some((role) => hasAdmin(role.permissions));
    const isOwner = guild.owner_id === userID;

    return isAdmin || isOwner;
  };
