require("dotenv").config();

import { Api } from "@top-gg/sdk";
import { createClient } from "droff";
import * as Interactions from "droff-interactions";
import { MongoClient } from "mongodb";
import * as Rx from "rxjs";
import * as Polls from "./polls/command";
import * as General from "./general";
import * as Topgg from "./topgg";
import { createCacheContext, createDbContext } from "./utils/contexts";

async function main() {
  const client = createClient({
    token: process.env.DISCORD_BOT_TOKEN!,
  });
  const mongo = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = mongo.db(process.env.MONGODB_DB!);
  const topgg = new Api(process.env.TOPGG_TOKEN!);
  const [cacheCtx, cacheEffects$] = createCacheContext(client);

  // Create interactions helper
  const ix = Interactions.create(client);

  const ctx = {
    ...createDbContext(db),
    ...cacheCtx,
    client,
    ix,
    createCommands: process.env.CREATE_GLOBAL_COMMANDS === "true",
    topgg,
  };

  Rx.merge(
    // Start client
    client.effects$,
    cacheEffects$,

    // Send stats to top.gg
    Topgg.postStats(ctx),

    // Register commands
    General.register(ctx),
    Polls.register(ctx),
  ).subscribe();
}

main();
