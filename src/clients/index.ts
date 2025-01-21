import { TwitterClientInterface } from "@elizaos/client-twitter";
import { Character, IAgentRuntime } from "@elizaos/core";

export async function initializeTwitterClient(
  character: Character,
  runtime: IAgentRuntime
) {
  const clientTypes = character.clients?.map((str) => str.toLowerCase()) || [];

  if (clientTypes.includes("twitter")) {
    return await TwitterClientInterface.start(runtime);
  }

  // Return null or handle cases where the Twitter client is not requested
  return null;
}