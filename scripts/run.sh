#!/bin/bash

# Navigate to the script's directory
#
echo "This script is used for running the agent in olas operate environment inside a docker container"
echo "Reading wallet and safe address from agents folder"
# wallet ovt key will be present inside the /agent_key/ethereum_private_key.txt folder
# safe address will be present inside the /agent_key/safe_address.txt folder
export AGENT_EOA_PK=$(cat /agent_key/ethereum_private_key.txt)

# Create a .env file and read the global ebv vars start with CONNECTION_CONFIGS_CONFIG_
echo "Creating .env file with CONNECTION_CONFIGS_CONFIG_ variables"
env | grep '^CONNECTION_CONFIGS_CONFIG_' > .env

echo "Running Agents fun."
# Run pnpm start
pnpm start
