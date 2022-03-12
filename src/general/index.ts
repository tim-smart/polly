import { ClientContext, InteractionsContext } from "../utils/contexts";
import * as Ping from "./ping";

export const register = (ctx: ClientContext & InteractionsContext) =>
  Ping.register(ctx);
