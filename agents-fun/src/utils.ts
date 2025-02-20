import type {
  Action,
  AgentRuntime,
  Character,
  Memory,
  Plugin,
} from "@elizaos/core";
import { elizaLogger, stringToUuid } from "@elizaos/core";
import net from "net";

import { ROOMS } from "./config/index.ts";
import type { RoomKey } from "./types.ts";

/**
 * Checks whether a port is available.
 */
function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Picks a free port, starting at the given number.
 */
export async function getAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await checkPortAvailable(port))) {
    elizaLogger.warn(`Port ${port} is in use, trying ${port + 1}`);
    port++;
  }
  return port;
}

/**
 * Creates a Memory object with a standard payload.
 */
export function createMemory(
  runtime: AgentRuntime,
  room: RoomKey,
  text = "Periodic check from Memeoor.",
): Memory {
  return {
    id: stringToUuid(Date.now().toString()),
    content: { text, action: "START" },
    roomId: stringToUuid(room),
    userId: stringToUuid("memeoor-user-1"),
    agentId: runtime.agentId,
  };
}

/**
 * Extracts and triggers the two plugin actions.
 * Returns true if the first action returned a truthy response.
 */
export async function triggerPluginActions(
  runtime: AgentRuntime,
  mem: Memory,
): Promise<boolean> {
  const plugin = runtime.plugins[0] as Plugin;
  const actions = plugin.actions as Action[];
  const tweetAction = actions[0] as Action;
  const memeInteractAction = actions[1] as Action;

  elizaLogger.log(`[Trigger] Executing tweet action...`);
  const result = await tweetAction.handler(
    runtime,
    mem,
    undefined,
    undefined,
    undefined,
  );
  if (result) {
    elizaLogger.log(
      `[Trigger] Tweet was successful. Executing meme interaction...`,
    );
    mem.roomId = stringToUuid(ROOMS.TOKEN_INTERACTION);
    await memeInteractAction.handler(
      runtime,
      mem,
      undefined,
      undefined,
      undefined,
    );
  } else {
    elizaLogger.warn("Tweet Interaction behaviour was unsuccessful");
  }
  return Boolean(result);
}
