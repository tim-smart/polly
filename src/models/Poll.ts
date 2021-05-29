import { Snowflake } from "droff/dist/types";
import { ObjectId } from "mongodb";

export interface Poll {
  _id?: ObjectId;
  interactionID: Snowflake;
  ownerID: Snowflake;
  question: string;
  multiple: boolean;
  anonymous: boolean;
  choices: Choice[];
}

export interface Choice {
  name: string;
}
