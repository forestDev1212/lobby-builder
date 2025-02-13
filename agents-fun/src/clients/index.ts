import { TwitterClientInterface } from "@elizaos/client-twitter";
import type { Client, IAgentRuntime } from "@elizaos/core";

export async function initializeTwitterClient(runtime: IAgentRuntime) {
  const clients: Client[] = [];

  const twitterClients: typeof TwitterClientInterface =
    (await TwitterClientInterface.start(
      runtime,
    )) as typeof TwitterClientInterface;
  clients.push(twitterClients);

  return clients;
}
