import * as Topgg from "@top-gg/sdk";
import { Client } from "droff";
import { InteractionsHelper } from "droff-interactions";
import { Collection, Db } from "mongodb";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";

export interface DbContext {
  db: Db;
  pollsCollection: Collection<Poll>;
  votesCollection: Collection<Vote>;
}

export const createDbContext = (db: Db): DbContext => ({
  db,
  pollsCollection: db.collection("polls"),
  votesCollection: db.collection("votes"),
});

export interface CommandContext {
  commands: InteractionsHelper;
}

export interface ClientContext {
  client: Client;
}

export interface TopggContext {
  topgg: Topgg.Api;
}
