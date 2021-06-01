require("dotenv").config();

import { createClient, Intents } from "droff";
import { MongoClient } from "mongodb";
import * as RxO from "rxjs/operators";
import * as Topgg from "@top-gg/sdk";

async function main() {
  const client = createClient({
    token: process.env.DISCORD_BOT_TOKEN!,
    intents: Intents.GUILDS,
  });
  const mongo = await MongoClient.connect(process.env.MONGODB_URI!, {
    useUnifiedTopology: true,
  });
  const db = mongo.db(process.env.MONGODB_DB!);
  const topgg = new Topgg.Api(process.env.TOPGG_TOKEN!);

  // Send stats to top.gg
  client.guilds$
    .pipe(
      RxO.auditTime(60000),
      RxO.flatMap((guilds) => {
        const serverCount = guilds.count();
        console.log("[main.ts]", "Updating top.gg serverCount", serverCount);
        return topgg.postStats({
          serverCount,
        });
      }),
    )
    .subscribe();

  // Register commands
  const commands = client.useSlashCommands();
  // poll
  require("./polls/command").register(commands, client, db);
  commands.start();
}

main();
