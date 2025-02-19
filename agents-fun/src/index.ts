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
  stringToUuid,
  settings,
} from "@elizaos/core";
import { ModelProviderName } from "@elizaos/core";
import path from "path";
import net from "net";
import { memeoorPlugin } from "plugin-memeooorr";
import { initializeDatabase } from "./database/index.ts";
import { initializeDbCache } from "./cache/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// print loaded env values
console.log();
const __dirname = path.dirname("./data");

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

    const tweetAction = elizaactions[0] as Action;
    const memeInteractAction = elizaactions[1] as Action;

    elizaLogger.log(`[First-Loop] Memeoor is deciding what to do...`);
    const resp = (await tweetAction.handler(
      runtime,
      firstMem,
      undefined,
      undefined,
      undefined,
    )) as Boolean;

    if (resp) {
      await memeInteractAction.handler(
        runtime,
        firstMem,
        undefined,
        undefined,
        undefined,
      );
    } else {
      elizaLogger.warn("Tweet Interaction behaviour was unsuccessful");
    }
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
      await runtime.databaseAdapter.createMemory(firstMem, "start", false);

      const plugin = runtime.plugins[0] as Plugin;
      const elizaactions: Action[] = plugin.actions as Action[];

      const tweetAction = elizaactions[0] as Action;
      const memeInteractAction = elizaactions[1] as Action;

      elizaLogger.log(`[Auto-Loop] Memeoor is deciding what to do...`);
      await tweetAction.handler(
        runtime,
        firstMem,
        undefined,
        undefined,
        undefined,
      );
      await memeInteractAction.handler(
        runtime,
        firstMem,
        undefined,
        undefined,
        undefined,
      );
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

    const safe_address_dict = process.env
      .CONNECTION_CONFIGS_CONFIG_SAFE_CONTRACT_ADDRESSES as string;
    let safe_adress = "";
    if (safe_address_dict) {
      try {
        const safe_address_obj = JSON.parse(safe_address_dict);
        if (safe_address_obj.base) {
          safe_adress = safe_address_obj.base;
        } else {
          console.error("Base key not found in the safe address dictionary.");
          process.exit(1);
        }
      } catch (error) {
        console.error("Failed to parse safe address dictionary:", error);
      }
    } else {
      console.error(
        "Safe address dictionary is not defined in the environment variables.",
      );
    }

    character.settings.secrets = {
      OPENAI_API_KEY: process.env
        .CONNECTION_CONFIGS_CONFIG_OPENAI_API_KEY as string,
      TWITTER_USERNAME: process.env
        .CONNECTION_CONFIGS_CONFIG_TWITTER_USERNAME as string,
      TWITTER_PASSWORD: process.env
        .CONNECTION_CONFIGS_CONFIG_TWITTER_PASSWORD as string,
      TWITTER_EMAIL: process.env
        .CONNECTION_CONFIGS_CONFIG_TWITTER_EMAIL as string,
      AGENT_EOA_PK: process.env.AGENT_EOA_PK as string,
      BASE_LEDGER_RPC: process.env
        .CONNECTION_CONFIGS_CONFIG_BASE_LEDGER_RPC as string,
      MEME_FACTORY_CONTRACT: process.env
        .CONNECTION_CONFIGS_CONFIG_MEME_FACTORY_CONTRACT as string,
      SAFE_ADDRESS_DICT: process.env
        .CONNECTION_CONFIGS_CONFIG_SAFE_CONTRACT_ADDRESSES as string,
      SAFE_ADDRESS: safe_adress,
      SUBGRAPH_URL: process.env
        .CONNECTION_CONFIGS_CONFIG_SUBGRAPH_URL as string,
      MEME_SUBGRAPH_URL: process.env
        .CONNECTION_CONFIGS_CONFIG_MEME_SUBGRAPH_URL as string,
      CHAIN_ID: process.env.CONNECTION_CONFIGS_CONFIG_BASE_CHAIN_ID as string,
    };

    console.log("Current character settings");
    console.log(character.settings.secrets);

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

    elizaLogger.success("token initialized");

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
