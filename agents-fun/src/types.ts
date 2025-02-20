import { ROOMS } from "./config";

export type RoomKey = keyof typeof ROOMS; // "TOKEN_INTERACTION" | "TWITTER_INTERACTION"
