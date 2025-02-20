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
  loadCharacterFromArgs,
  fetchSafeAddress,
  getSecrets,
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
 * Main entry point: initializes configuration, database and agent runtime.
 */
export async function main() {
  try {
    // Initialize the direct client
    const directClient = new DirectClient();

    // Get available server port
    const serverPort = await getAvailablePort(
      parseInt(settings.SERVER_PORT || "3000"),
    );

    // Load and configure the character
    const character = await loadCharacterFromArgs();

    // Retrieve the safe address and assign secrets
    const safeAddress = fetchSafeAddress();
    character.settings.secrets = getSecrets(safeAddress);

    // Additional logging details
    elizaLogger.success(`Character Name: ${character.name}`);
    elizaLogger.success(`Character Bio: ${character.bio}`);

    // Define model provider and specific model settings
    character.modelProvider = ModelProviderName.OPENAI;
    character.settings.model = "gpt-4o";
    character.settings.modelConfig = {
      temperature: 0.5,
      maxInputTokens: 2000,
      max_response_length: 1000,
    };

    // Generate token for current provider
    const token = getTokenForProvider(
      character.modelProvider,
      character,
    ) as string;
    elizaLogger.success("Token initialized");

    // Initialize the database and cache
    const dataDir = path.join(__dirname, "data");
    const db = initializeDatabase(dataDir);
    elizaLogger.success("Database initialized");
    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token);
    await runtime.initialize();

    // Start directClient server and launch agent's autonomous loop
    directClient.start(serverPort);
    await runAgentAutonomously(runtime, directClient);

    elizaLogger.success(`Agent ${runtime.agentId} initialized and running!`);
  } catch (error) {
    console.error(error);
    elizaLogger.error("Failed to start Memeoor Agent:", error);
    process.exit(1);
  }
}

void main();
