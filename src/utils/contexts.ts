import * as Topgg from "@top-gg/sdk";
import { Client } from "droff";
import { InteractionsHelper } from "droff-interactions";
import {
  CacheStore,
  CacheStoreHelpers,
  NonParentCacheStore,
  NonParentCacheStoreHelpers,
} from "droff/caches/stores";
import { Guild, Role } from "droff/types";
import { Collection, Db } from "mongodb";
import * as Rx from "rxjs";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";

export interface CacheContext {
  guildsCache: NonParentCacheStore<Guild> & NonParentCacheStoreHelpers<Guild>;
  rolesCache: CacheStore<Role> & CacheStoreHelpers<Role>;
}

export const createCacheContext = (
  c: Client,
): readonly [CacheContext, Rx.Observable<void>] => {
  const [guildsCache, guildsCache$] = c.guildsCache();
  const [rolesCache, rolesCache$] = c.rolesCache();

  return [
    { guildsCache, rolesCache },
    Rx.merge(guildsCache$, rolesCache$),
  ] as const;
};

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

export interface InteractionsContext {
  ix: InteractionsHelper;
}

export interface ClientContext {
  client: Client;
}

export interface TopggContext {
  topgg: Topgg.Api;
}
