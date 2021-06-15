require("dotenv").config();

import { Api } from "@top-gg/sdk";
import { createClient, Intents } from "droff";
import { MongoClient } from "mongodb";
import * as Topgg from "./topgg";
import * as Poll from "./polls/command";
import * as Interactions from "droff-interactions";
import * as Rx from "rxjs";

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

  Rx.merge(
    // Send stats to top.gg
    Topgg.postStats$(client, topgg),

    // Start client and interactions
    client.effects$,
    commands.effects$,

    // Register commands
    Poll.register(commands, client, db),
  ).subscribe();
}

main();
