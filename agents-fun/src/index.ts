import { DirectClient } from "@elizaos/client-direct";
import {
  type Action,
  type Plugin,
  AgentRuntime,
  elizaLogger,
  type Character,
  type Memory,
  stringToUuid,
  settings,
  ModelProviderName,
} from "@elizaos/core";
import path from "path";
import { memeoorPlugin } from "plugin-memeooorr";
import dotenv from "dotenv";

import { initializeDatabase } from "./database/index.ts";
import { initializeDbCache } from "./cache/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import {
  getAvailablePort,
  createMemory,
  triggerPluginActions,
} from "./utils.ts";
import { ROOMS } from "./config/index.ts";

// Load environment variables from .env file
dotenv.config();

const __dirname = path.dirname("./data");

/**
 * Creates the AgentRuntime using only the memeoorPlugin.
 */
function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string,
): AgentRuntime {
  elizaLogger.info("Creating agent runtime for", character.name);

  return new AgentRuntime({
    databaseAdapter: db,
    token,
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
}

/**
 * Runs the agent in autonomous mode using an initial action trigger and
 * periodic checking.
 */
async function runAgentAutonomously(
  runtime: AgentRuntime,
  directClient: DirectClient,
) {
  let firstMem: Memory = createMemory(runtime, ROOMS.TWITTER_INTERACTION);
  elizaLogger.success("Running Memeoor Agent in autonomous mode...");

  directClient.registerAgent(runtime);

  // Initial trigger
  try {
    elizaLogger.log(`[First-Loop] Memeoor is deciding what to do...`);
    await runtime.databaseAdapter.createMemory(firstMem, "start", false);
    await triggerPluginActions(runtime, firstMem);
  } catch (err) {
    elizaLogger.error("Error in initial autonomous loop:", err);
  }

  // Periodically trigger actions
  const intervalMs = 60_00000; // 1 minute
  setInterval(async () => {
    try {
      elizaLogger.log(`[Auto-Loop] Memeoor is deciding what to do...`);
      const mem = createMemory(runtime, ROOMS.TWITTER_INTERACTION);
      await runtime.databaseAdapter.createMemory(mem, "start", false);
      await triggerPluginActions(runtime, mem);
    } catch (err) {
      elizaLogger.error("Error in autonomous loop:", err);
    }
  }, intervalMs);
}

/**
 * Main entry point: loads configuration, initializes the database,
 * sets up the agent and starts the autonomous task loop.
 */
export async function main() {
  try {
    const directClient = new DirectClient();
    const args = parseArguments();
    const serverPort = await getAvailablePort(
      parseInt(settings.SERVER_PORT || "3000"),
    );

    // Load characters from arguments
    const charactersArg = args.characters || args.character;
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

    // Configure the first character
    const character = characters[0];
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;
    character.settings ??= {};

    // Parse safe address configuration from environment variable
    const safeAddressDict = process.env
      .CONNECTION_CONFIGS_CONFIG_SAFE_CONTRACT_ADDRESSES as string;
    let safeAddress = "";
    if (safeAddressDict) {
      try {
        const safeAddressObj = JSON.parse(safeAddressDict);
        if (safeAddressObj.base) {
          safeAddress = safeAddressObj.base;
        } else {
          console.error("Base key not found in the safe address dictionary.");
          process.exit(1);
        }
      } catch (error) {
        console.error("Failed to parse safe address dictionary:", error);
        process.exit(1);
      }
    } else {
      console.error(
        "Safe address dictionary is not defined in the environment variables.",
      );
      process.exit(1);
    }

    // Set character secrets and model settings
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
      SAFE_ADDRESS_DICT: safeAddressDict,
      SAFE_ADDRESS: safeAddress,
      SUBGRAPH_URL: process.env
        .CONNECTION_CONFIGS_CONFIG_SUBGRAPH_URL as string,
      MEME_SUBGRAPH_URL: process.env
        .CONNECTION_CONFIGS_CONFIG_MEME_SUBGRAPH_URL as string,
      CHAIN_ID: process.env.CONNECTION_CONFIGS_CONFIG_BASE_CHAIN_ID as string,
    };

    console.log("Current character settings", character.settings.secrets);

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
    elizaLogger.success("Token initialized");

    // Initialize database and cache
    const dataDir = path.join(__dirname, "data");
    const db = initializeDatabase(dataDir);
    elizaLogger.info("Database initialized");
    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token);
    await runtime.initialize();

    directClient.start(serverPort);
    await runAgentAutonomously(runtime, directClient as DirectClient);

    elizaLogger.success(`Agent ${runtime.agentId} initialized and running!`);
  } catch (error) {
    console.error(error);
    elizaLogger.error("Failed to start Memeoor Agent:", error);
    process.exit(1);
  }
}

void main();
