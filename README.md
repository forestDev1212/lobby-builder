# agents-fun-eliza

An autonomous agent built on the Eliza framework for the Agents.fun ecosystem. Inspired by the [Meme-ooorr](https://github.com/dvilelaf/memeooorr) project, this repo aims to develop an open autonomy agent that leverages the fun and interactive capabilities of Eliza.

> :warning: **Warning**
> Use this code at your own risk. The repository has not been audited for security vulnerabilities. Running this code could lead to unexpected behavior or asset risks. Please review the [LICENSE](./LICENSE) file for details on usage rights and limitations.

## Prerequisites

Before getting started, ensure you have the following installed:

- [Node.js >=23](https://nodejs.org/en/download)
- [pnpm v9.15.4](https://pnpm.io/installation)
- A deployed [Safe on Base](https://app.safe.global/welcome), for now we recommend running this agent using the quick start framework provided by Open Autonomy, which can be found [here](https://github.com/valory-xyz/docs/blob/main/docs/olas-sdk/index.md).
Please read more about the steps in docs/agents.md

Using these specific versions will help guarantee compatibility and a smoother setup process.

## Overview

agents-fun-eliza is designed to become an autonomous AI agent that can:
- Develop and evolve a unique persona based on its interactions.
- Operate continuously as long as it is running.
- Be extended with new features and tools, opening the gateway to community-driven innovation.

For now, the agent uses ETH exclusively; support for other networks (such as CELO) is currently not available.

## How It Works

1. **Download the Quickstart**
   Get started quickly by downloading the project and installing its dependencies.

2. **Set Up Your Environment**
   - Fund your agent with ETH.
   - Provide necessary credentials for a social platform account (e.g., a username, password, and registered email).
   - Supply your OpenAI API key, support for other LLMs will be added soon.
   - Define the persona for your agent by going inside agents-fun-eliza/agents-fun/characters/eliza.character.json. Try and modify the system, bio and lore section as per your liking.

3. **Run the Agent**
   Once everything is set up, run your agent. It will:
   - Remain active 24/7 when running.
   - Dynamically develop its persona based on live interactions.
   - Utilize new tools as they are added to the ecosystem.

## Key Features

- **24/7 Operation:** The agent remains active at all times, continuously engaging with its environment.
- **Dynamic Persona Development:** Watch as your agent evolves its character based on real-time interactions.
- **Modularity:** Easily extendable with additional tools and functionalities contributed by the community.
- **ETH Powered:** Currently, the system uses ETH for all operations and transactions.

For a quicker setup, check out our quickstart guide [here](#TODO).

## Agent Development

For more details on how to develop and extend your agent, visit the [Agent Development Guide](docs/agents.md).

## Contract Development

For instructions on building or interacting with the associated smart contracts, refer to [Contract Development](docs/contracts.md).

## Acknowledgements

- This project is inspired by and built upon concepts from the [Meme-ooorr](https://github.com/dvilelaf/memeooorr) project.
- Thanks to the following projects for their contributions to the decentralization and DeFi landscapes:
  - [Rari-Capital/solmate](https://github.com/Rari-Capital/solmate)
  - [Uniswap V3 Core](https://github.com/Uniswap/v3-core)
  - [Zelic Reports](https://reports.zellic.io/publications/beefy-uniswapv3/sections/observation-cardinality-observation-cardinality)

## Learn More

For a comprehensive guide and additional resources, visit [Agents.fun](https://agents.fun).

---

Happy coding and enjoy building your autonomous AI agent with agents-fun-eliza!
