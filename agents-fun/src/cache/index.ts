import { CacheManager, DbCacheAdapter } from "@elizaos/core";
import type { Character, IDatabaseCacheAdapter } from "@elizaos/core";

export function initializeDbCache(
  character: Character,
  db: IDatabaseCacheAdapter,
) {
  if (!character.id) {
    throw new Error("Character must have an ID to initialize cache");
  }
  const cache = new CacheManager(new DbCacheAdapter(db, character.id));
  return cache;
}
