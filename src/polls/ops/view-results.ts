import { SnowflakeMap } from "droff/dist/gateway-utils/resources";
import {
  Embed,
  Guild,
  GuildMember,
  Interaction,
  PermissionFlag,
  Role,
} from "droff/dist/types";
import * as O from "fp-ts/Option";
import { Db } from "mongodb";
import { Poll } from "../../models/Poll";
import * as Helpers from "../helpers";
import * as Repo from "../repo";
import * as Ui from "../ui";

export const run =
  (db: Db) =>
  (poll: Poll) =>
  async (
    { member }: Interaction,
    guild: Guild,
    roles: SnowflakeMap<Role>,
  ): Promise<O.Option<Embed>> => {
    const canView = hasPermission(poll, guild, roles)(member!);
    if (!canView) return O.none;

    const votes = await Repo.votes(db)(poll._id!);
    const votesMap = Helpers.votesMap(poll, votes);

    return O.some(Ui.embed(poll, votes, votesMap, true));
  };

const hasPermission =
  (poll: Poll, guild: Guild, roles: SnowflakeMap<Role>) =>
  (member: GuildMember) => {
    const userID = member!.user!.id;
    if (poll.ownerID === userID) return true;

    const isAdmin = member.roles
      .map((id) => roles.get(id)!)
      .some((role) => BigInt(role.permissions) & PermissionFlag.ADMINISTRATOR);
    const isOwner = guild.owner_id === userID;

    return isAdmin || isOwner;
  };
