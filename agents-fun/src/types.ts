import { ROOMS } from "./config/index.ts";

export type RoomKey = keyof typeof ROOMS; // "TOKEN_INTERACTION" | "TWITTER_INTERACTION"
