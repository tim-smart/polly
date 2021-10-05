import { Client } from "droff";
import { InteractionContext } from "droff-interactions";
import { SnowflakeMap } from "droff/dist/caches/resources";
import { Guild, InteractionCallbackDatum, Role } from "droff/dist/types";
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { Db } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { Poll } from "../../models/Poll";
import * as Responses from "../../utils/responses";
import * as Helpers from "../helpers";
import * as ViewResults from "../ops/view-results";
import * as Repo from "../repo";

export const handle =
  (client: Client, db: Db) => (source$: Rx.Observable<InteractionContext>) =>
    F.pipe(
      source$,

      client.withCaches({ roles: client.roles$ })(
        ({ interaction }) => interaction.guild_id,
      ),
      client.onlyWithGuild(),

      RxO.flatMap(([context, { guild, roles }]) =>
        F.pipe(
          // Fetch poll from interaction data
          fetchPoll(db)(context),
          // Create the poll embed
          TE.chain((poll) => createResponse(db)(context, poll, guild, roles)),
          // Try to send it (or display error)
          Responses.ephemeral(context),
        )(),
      ),

      // Log any errors
      RxO.tap(E.mapLeft(console.error)),
    );

const fetchPoll = (db: Db) => (ctx: InteractionContext) =>
  F.pipe(
    Helpers.resultsIdDetails(ctx.interaction.data!.custom_id || ""),
    TE.fromOption(() => "Could not extract poll information from custom_id"),
    TE.chain(({ pollID }) => Repo.get(db)(pollID)),
  );

const createResponse =
  (db: Db) =>
  (
    context: InteractionContext,
    poll: Poll,
    guild: Guild,
    roles: SnowflakeMap<Role>,
  ) =>
    F.pipe(
      ViewResults.run(db)(poll)(context.interaction, guild, roles),
      TE.map(
        (embed): InteractionCallbackDatum => ({
          embeds: [embed],
        }),
      ),
    );
