import { SlashCommandContext } from "droff/dist/slash-commands/factory";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Db } from "mongodb";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Helpers from "./helpers";
import * as Repo from "./repo";
import { Client } from "droff";
import * as ViewResults from "./ops/view-results";

export const handle =
  (client: Client, db: Db) => (source$: Rx.Observable<SlashCommandContext>) =>
    F.pipe(
      source$,

      // Extract poll information from custom_id
      RxO.flatMap((ctx) =>
        F.pipe(
          Helpers.resultsIdDetails(ctx.interaction.data!.custom_id),
          O.fold(
            () => Rx.EMPTY,
            (details) => Rx.of([ctx, details] as const),
          ),
        ),
      ),

      // Get the poll from the repo
      RxO.flatMap(([ctx, { pollID }]) =>
        Rx.zip(Rx.of(ctx), Repo.get(db)(pollID)),
      ),

      // Check permissions
      client.withCaches({ roles: client.roles$ })(
        ([{ interaction }]) => interaction.guild_id,
      ),
      client.onlyWithGuild(),

      // Try to generate the embed
      RxO.flatMap(([[ctx, poll], { guild, roles }]) =>
        Rx.zip(
          Rx.of(ctx),
          ViewResults.run(db)(poll)(ctx.interaction, guild, roles),
        ),
      ),

      RxO.flatMap(([ctx, embed]) =>
        F.pipe(
          embed,
          O.fold(
            () =>
              ctx.respond({
                content:
                  "You need to be the poll owner or an admin to view the results.",
                flags: 64,
              }),
            (embed) =>
              ctx.respond({
                embeds: [embed],
                flags: 64,
              }),
          ),
        ),
      ),
    );
