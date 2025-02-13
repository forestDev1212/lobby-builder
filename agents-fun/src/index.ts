/**
 * Minimal "main.ts" that runs an autonomous agent
 * using only the memeoorPlugin.
 */
import { DirectClient } from "@elizaos/client-direct";
import {
  // IAgentRuntime,
  type Action,
  type Plugin,
  AgentRuntime,
  elizaLogger,
  type Character,
  type Memory,
  MemoryManager,
  stringToUuid,
  settings,
} from "@elizaos/core";
import { ModelProviderName } from "@elizaos/core";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";
import { memeoorPlugin } from "plugin-memeooorr";
import { initializeDatabase } from "./database/index.ts";
import { initializeDbCache } from "./cache/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
// import { ACTIONS } from "plugin-memeooorr";
// import { getProtocolKit } from "../../packages/plugin-memeooorr/src/providers/safeaccount.ts";
// import Safe from "@safe-global/protocol-kit";

// const __filename = fileURLToPath("./data");
const __dirname = path.dirname("./data");

// getProtocolKit(
//   process.env.BASE_LEDGER_RPC,
//   process.env.SAFE_ADDRESS as `0x${string}`,
//   process.env.AGENT_EOA_PK as `0x${string}`,
// );

// interface ElizaTestGenerator extend IText

/**
 * A minimal function to create the AgentRuntime with our single plugin.
 */
function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string,
): AgentRuntime {
  elizaLogger.info("Creating agent runtime for", character.name);

  // Create the runtime using only the memeoorPlugin
  const runtime = new AgentRuntime({
    databaseAdapter: db,
    token: token,
    character,
    modelProvider: character.modelProvider,
    plugins: [memeoorPlugin],
    evaluators: [],
    cacheManager: cache,
    providers: [],
    actions: [],
    services: [],
    managers: [],
  });

  return runtime;
}

/**
 * Runs the agent in "autonomous" mode. In practice,
 * you can do any scheduling/interval tasks you want here.
 */
async function runAgentAutonomously(
  runtime: AgentRuntime,
  directClient: DirectClient,
) {
  elizaLogger.success("Running Memeoor Agent in autonomous mode...");

  // One naive example: periodically attempt an action from the plugin.
  // If your plugin has logic that triggers automatically,
  // you can simply keep the agent "alive" so it can do its own stuff.

  // For demonstration, let's do a simple setInterval that:
  // 1) Waits randomly
  // 2) Calls plugin actions

  directClient.registerAgent(runtime);
  try {
    elizaLogger.log(`[First-Loop] Memeoor is deciding what to do...`);

    const firstMem: Memory = {
      id: stringToUuid(Date.now().toString()),
      content: { text: "Periodic check from Memeoor.", action: "START" },
      roomId: stringToUuid("memeoor-room-1"),
      userId: stringToUuid("memeoor-user-1"),
      agentId: runtime.agentId,
    };

    await runtime.databaseAdapter.createMemory(firstMem, "start", false);

    const plugin = runtime.plugins[0] as Plugin;
    const elizaactions: Action[] = plugin.actions as Action[];

    const action2 = elizaactions[1] as Action;

    elizaLogger.log(`[First-Loop] Memeoor is deciding what to do...`);
    // await action1.handler(runtime, firstMem, null, null, null);
    // await action2.handler(runtime, firstMem, undefined, undefined, undefined);
  } catch (err) {
    elizaLogger.error("Error in autonomous loop:", err);
  }
  const intervalMs = 60_00000; // 1 minute

  setInterval(async () => {
    try {
      elizaLogger.log(`[Auto-Loop] Memeoor is deciding what to do...`);

      // If you need to store an event in memory for the plugin:
      const firstMem: Memory = {
        id: stringToUuid(Date.now().toString()),
        content: { text: "Periodic check from Memeoor.", action: "START" },
        roomId: stringToUuid("memeoor-room-1"),
        userId: stringToUuid("memeoor-user-1"),
        agentId: runtime.agentId,
      };

      // This calls the agent to process something.
      // If your plugin automatically runs actions,
      // you might just store the memory.
      // Or you might directly call an action from the plugin.
      //
      // If "memeoorPlugin" runs on new messages, do something like:
      await runtime.messageManager.createMemory(firstMem);

      const plugin = runtime.plugins[0] as Plugin;
      const elizaactions: Action[] = plugin.actions as Action[];

      const action2 = elizaactions[1] as Action;

      elizaLogger.log(`[Auto-Loop] Memeoor is deciding what to do...`);
      // await action1.handler(iRun, firstMem, null, null, null);
      // await action2.handler(iRun, firstMem, null, null, null);
    } catch (err) {
      elizaLogger.error("Error in autonomous loop:", err);
    }
  }, intervalMs);

  // Keep the process alive indefinitely.
}

const checkPortAvailable = (port: number): Promise<boolean> => {
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
};

/**
 * Main entry point: create & initialize the agent, then start the loop.
 */
export async function main() {
  try {
    const directClient = new DirectClient();
    const args = parseArguments();
    let serverPort = parseInt(settings.SERVER_PORT || "3000");

    while (!(await checkPortAvailable(serverPort))) {
      elizaLogger.warn(
        `Port ${serverPort} is in use, trying ${serverPort + 1}`,
      );
      serverPort++;
    }

    let charactersArg = args.characters || args.character;

    let characters: Character[] = [];

    console.log("charactersArgs", charactersArg);
    if (charactersArg) {
      characters = await loadCharacters(charactersArg);
    }
    console.log("characters", characters);

    if (characters.length === 0) {
      elizaLogger.error("No characters loaded, exiting...");
      process.exit(1);
    }

    const character = characters[0];

    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    character.settings ??= {};

    character.settings.secrets ??= {
      OPEN_API_KEY: process.env.OPEN_API_KEY as string,
      TWITTER_USERNAME: process.env.TWITTER_USERNAME as string,
      TWITTER_PASSWORD: process.env.TWITTER_PASSWORD as string,
      VIEM_BASE_PRIVATE_KEY: process.env.VIEM_BASE_PRIVATE_KEY as string,
      VIEM_BASE_RPC_URL: process.env.VIEM_BASE_RPC_URL as string,
      BUNDLER_BASE_URL: process.env.BUNDLER_BASE_URL as string,
      BUNDLER_CELO_URL: process.env.BUNDLER_CELO_URL as string,
      MEME_FACTORY_CONTRACT: process.env.MEME_FACTORY_CONTRACT as string,
      SAFE_CONTRACT: process.env.SAFE_CONTRACT as string,
      PROXY_FACTORY_CONTRACT: process.env.PROXY_FACTORY_CONTRACT as string,
      SUBGRAPH_URL: process.env.SUBGRAPH_URL as string,
    };

    character.modelProvider = ModelProviderName.OPENAI;
    character.settings.model = "gpt-4o-mini";
    character.settings.modelConfig = {
      temperature: 0.5,
      maxInputTokens: 2000,
    };

    const token = getTokenForProvider(
      character.modelProvider,
      character,
    ) as string;

    elizaLogger.info("token initialized");

    const dataDir = path.join(__dirname, "data");
    const db = initializeDatabase(dataDir);
    elizaLogger.info("Database initialized");

    await db.init();
    console.log("Creating protocol");

    const cache = initializeDbCache(character, db);

    const runtime = createAgent(character, db, cache, token);

    // Initialize the agent (loads plugin setup, etc.)
    await runtime.initialize();

    directClient.start(serverPort);

    // Start the “autonomous” loop or scheduling
    await runAgentAutonomously(runtime, directClient as DirectClient);

    elizaLogger.success(`Agent ${runtime.agentId} initialized and running!`);
  } catch (error) {
    console.log(error);
    elizaLogger.error("Failed to start Memeoor Agent:", error);
    process.exit(1);
  }
}

void main();
