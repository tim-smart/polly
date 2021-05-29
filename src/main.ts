require("dotenv").config();

import { createClient, Intents } from "droff";
import { MongoClient } from "mongodb";

async function main() {
  const client = createClient({
    token: process.env.DISCORD_BOT_TOKEN!,
    intents: Intents.GUILDS,
  });

  const mongo = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = mongo.db(process.env.MONGODB_DB!);

  const commands = client.useSlashCommands();

  // Register commands
  require("./commands/poll").register(commands, db);

  commands.start();
}

main();
