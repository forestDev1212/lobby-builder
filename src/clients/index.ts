import { TwitterClientInterface } from "@elizaos/client-twitter";
import { Character, IAgentRuntime } from "@elizaos/core";

export async function initializeTwitterClient(
  character: Character,
  runtime: IAgentRuntime,
) {
  const clients = [];

  const twitterClients = TwitterClientInterface.start(runtime);
  clients.push(twitterClients);

  return clients;
}
