import { InteractionContext } from "droff-interactions";
import {
  InteractionCallbackDatum,
  InteractionCallbackMessage,
} from "droff/dist/types";
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";
import * as R from "fp-ts/Reader";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { CacheContext, ClientContext, DbContext } from "../../utils/contexts";
import * as Responses from "../../utils/responses";
import * as Helpers from "../helpers";
import * as ViewResults from "../ops/view-results";
import * as Repo from "../repo";

export const handle =
  (ctx: ClientContext & DbContext & CacheContext) =>
  (source$: Rx.Observable<InteractionContext>) =>
    F.pipe(
      source$,

      ctx.client.withCaches({
        guild: ctx.guildsCache.getOr((id) => ctx.client.getGuild(id, {})),
        roles: ctx.rolesCache.getForParent,
      })(({ interaction }) => interaction.guild_id),
      ctx.client.onlyWithCacheResults(),

      RxO.flatMap(([context, { guild, roles }]) =>
        F.pipe(
          // Fetch poll from interaction data
          fetchPoll(context),
          // Create the poll embed
          RTE.chain((poll) =>
            createResponse({
              poll,
              interaction: context.interaction,
              guild,
              roles,
            }),
          ),
          // Try to send it (or display error)
          R.map(Responses.ephemeral(context)),
        )(ctx)(),
      ),

      // Log any errors
      RxO.tap(E.mapLeft(console.error)),
    );

const fetchPoll = (ctx: InteractionContext) =>
  F.pipe(
    Helpers.resultsIdDetails(ctx.interaction.data!.custom_id || ""),
    RTE.fromOption(() => "Could not extract poll information from custom_id"),
    RTE.chain(({ pollID }) => Repo.get(pollID)),
  );

const createResponse = F.flow(
  ViewResults.run,
  RTE.map(
    (embed): InteractionCallbackMessage => ({
      embeds: [embed],
    }),
  ),
);
