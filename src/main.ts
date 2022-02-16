require("dotenv").config();

import { Api } from "@top-gg/sdk";
import { createClient, Intents } from "droff";
import * as Interactions from "droff-interactions";
import { MongoClient } from "mongodb";
import * as Rx from "rxjs";
import * as Poll from "./polls/command";
import * as Topgg from "./topgg";
import { createDbContext } from "./utils/contexts";

async function main() {
  const client = createClient({
    token: process.env.DISCORD_BOT_TOKEN!,
    gateway: {
      intents: Intents.GUILDS,
    },
  });
  const mongo = await MongoClient.connect(process.env.MONGODB_URI!, {
    useUnifiedTopology: true,
  });
  const db = mongo.db(process.env.MONGODB_DB!);
  const topgg = new Api(process.env.TOPGG_TOKEN!);

  // Create interactions helper
  const commands = Interactions.create(client);

  const ctx = {
    ...createDbContext(db),
    client,
    commands,
    topgg,
  };

  Rx.merge(
    // Start client
    client.effects$,

    // Send stats to top.gg
    Topgg.postStats(ctx),

    // Register commands
    Poll.register(ctx),
  ).subscribe();
}

main();
