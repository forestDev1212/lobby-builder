> :warning: **Warning** <br />
> All commands are assumed to be run from root!

# Agent Development

## System requirements

- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Set Docker permissions so you can run containers as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)


## Run you own agent

### Get the code

1. Clone this repo:

    ```
    git clone --recurse-submodules git@github.com:valory-xyz/agents-fun-eliza.git
    ```

    Alternatively, if you have already cloned, ensure submodules are initialized:
    ```
    git submodule update --init --recursive
    ```

2. Install dependencies:

    ```
    cd agents-fun-eliza
    pnpm install
    ```

3. Define your character description in agents-fun/characters/eliza.character.json and update the system, bio and lore section as per your liking.

4. Build and push the agent to your docker hub :
  ```
   pnpm build:agent
   ```

#### Prepare the data

1. Edit the character file in agents-fun/characters/eliza.character.json and update the system, bio and lore section as per your liking.
2. Follow the steps mentioned in [Olas-sdk-docs](https://github.com/valory-xyz/docs/blob/main/docs/olas-sdk/index.md), to build a olas agent using [Olas SDK Starter](https://github.com/valory-xyz/olas-sdk-starter/blob/main/README.md) and the docker image of the agent.

For the Eliza Memeooorr agent we support agentic runs using olas-sdk. Which provides a set of tools to build and run agents, with a automatic safe account creation and management.
