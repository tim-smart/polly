import { Snowflake } from "droff/dist/types";
import { ObjectId } from "mongodb";

export interface Vote {
  _id?: ObjectId;
  pollID: ObjectId;
  userID: Snowflake;
  option: string;
}
