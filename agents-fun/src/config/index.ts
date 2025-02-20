import {
  type Character,
  ModelProviderName,
  elizaLogger,
  settings,
  stringToUuid,
  validateCharacterConfig,
} from "@elizaos/core";
import fs from "fs";
import path from "path";
import yargs from "yargs";

export function parseArguments(): {
  character?: string;
  characters?: string;
} {
  try {
    return yargs(process.argv.slice(2))
      .option("character", {
        type: "string",
        description: "Path to the character JSON file",
      })
      .option("characters", {
        type: "string",
        description: "Comma separated list of paths to character JSON files",
      })
      .parseSync();
  } catch (error) {
    console.error("Error parsing arguments:", error);
    return {};
  }
}

export async function loadCharacters(
  charactersArg: string,
): Promise<Character[]> {
  let characterPaths = charactersArg?.split(",").map((filePath) => {
    if (path.basename(filePath) === filePath) {
      filePath = "../characters/" + filePath;
    }
    return path.resolve(process.cwd(), filePath.trim());
  });

  const loadedCharacters: Character[] = [];

  if (characterPaths?.length > 0) {
    for (const path of characterPaths) {
      try {
        const character = JSON.parse(fs.readFileSync(path, "utf8"));

        validateCharacterConfig(character);

        loadedCharacters.push(character);
      } catch (e) {
        console.error(`Error loading character from ${path}: ${e}`);
        // don't continue to load if a specified file is not found
        process.exit(1);
      }
    }
  }

  return loadedCharacters;
}

export function getTokenForProvider(
  provider: ModelProviderName,
  character: Character,
): string | undefined {
  switch (provider) {
    case ModelProviderName.OPENAI:
      return (
        character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY
      );
    case ModelProviderName.LLAMACLOUD:
      return (
        character.settings?.secrets?.LLAMACLOUD_API_KEY ||
        settings.LLAMACLOUD_API_KEY ||
        character.settings?.secrets?.TOGETHER_API_KEY ||
        settings.TOGETHER_API_KEY ||
        character.settings?.secrets?.XAI_API_KEY ||
        settings.XAI_API_KEY ||
        character.settings?.secrets?.OPENAI_API_KEY ||
        settings.OPENAI_API_KEY
      );
    case ModelProviderName.ANTHROPIC:
      return (
        character.settings?.secrets?.ANTHROPIC_API_KEY ||
        character.settings?.secrets?.CLAUDE_API_KEY ||
        settings.ANTHROPIC_API_KEY ||
        settings.CLAUDE_API_KEY
      );
    case ModelProviderName.REDPILL:
      return (
        character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY
      );
    case ModelProviderName.OPENROUTER:
      return (
        character.settings?.secrets?.OPENROUTER || settings.OPENROUTER_API_KEY
      );
    case ModelProviderName.GROK:
      return character.settings?.secrets?.GROK_API_KEY || settings.GROK_API_KEY;
    case ModelProviderName.HEURIST:
      return (
        character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY
      );
    case ModelProviderName.GROQ:
      return character.settings?.secrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Loads and configures the character from CLI arguments.
 */
export async function loadCharacterFromArgs(): Promise<Character> {
  const args = parseArguments();
  const charactersArg = args.characters || args.character;
  let characters: Character[] = [];
  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
  }
  if (characters.length === 0) {
    elizaLogger.error("No characters loaded, exiting...");
    process.exit(1);
  }
  // Use the first character from the list as the active character.
  const character = characters[0];
  character.id ??= stringToUuid(character.name);
  character.username ??= character.name;
  character.settings ??= {};
  return character;
}

/**
 * Retrieves the safe contract address from the environment variable.
 */
export function fetchSafeAddress(): string {
  const safeAddressDict =
    process.env.CONNECTION_CONFIGS_CONFIG_SAFE_CONTRACT_ADDRESSES;
  if (!safeAddressDict) {
    console.error(
      "Safe address dictionary is not defined in the environment variables.",
    );
    process.exit(1);
  }
  try {
    const safeAddressObj = JSON.parse(safeAddressDict);
    if (safeAddressObj.base) return safeAddressObj.base;
    else {
      console.error("Base key not found in the safe address dictionary.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to parse safe address dictionary:", error);
    process.exit(1);
  }
}

/**
 * Collects all required secrets from environment variables.
 */
export function getSecrets(safeAddress: string): Record<string, string> {
  return {
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
    SAFE_ADDRESS: safeAddress,
    SUBGRAPH_URL: process.env.CONNECTION_CONFIGS_CONFIG_SUBGRAPH_URL as string,
    MEME_SUBGRAPH_URL: process.env
      .CONNECTION_CONFIGS_CONFIG_MEME_SUBGRAPH_URL as string,
    CHAIN_ID: process.env.CONNECTION_CONFIGS_CONFIG_BASE_CHAIN_ID as string,
  };
}

export const ROOMS = {
  TOKEN_INTERACTION: "TOKEN_INTERACTION",
  TWITTER_INTERACTION: "TWITTER_INTERACTION",
} as const;
