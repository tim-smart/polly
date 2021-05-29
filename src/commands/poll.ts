import { SlashCommandsHelper } from "droff";
import * as New from "./poll/new";
import * as Vote from "./poll/vote";
import * as RxO from "rxjs/operators";
import * as Commands from "../utils/commands";
import { Db } from "mongodb";

export const register = (commands: SlashCommandsHelper, db: Db) => {
  const poll$ = commands.guild({
    name: "poll",
    description: "Create and manage polls",
    options: [New.command],
  });

  // New sub-command
  poll$
    .pipe(RxO.filter(Commands.isSubCommand("new")), New.handle(db))
    .subscribe();

  // Handle votes
  commands
    .component(/^vote_/)
    .pipe(Vote.handle(db))
    .subscribe();
};
