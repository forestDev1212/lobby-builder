#!/bin/bash

# Prompt the user to enter their Docker username
read -p "Enter your Docker username: " DOCKER_USERNAME

# Check if the Docker username is empty
if [ -z "$DOCKER_USERNAME" ]; then
  echo "Docker username cannot be empty."
  exit 1
fi

# Ask if the user has an IPFS hash for their image
read -p "Do you have an IPFS hash for your image? (y/n): " HAS_IPFS_HASH

if [ "$HAS_IPFS_HASH" != "y" ]; then
  echo "Please visit the following link to learn more about how to register and mint your agent to generate an IPFS hash for your image:"
  echo "https://github.com/valory-xyz/olas-sdk-starter/blob/main/README.md"
  echo "Once you are ready with your hash, you can come back and build again."
  exit 0
fi

# Prompt the user to enter their IPFS hash
read -p "Enter your IPFS hash: " IPFS_HASH

# Check if the IPFS hash is empty
if [ -z "$IPFS_HASH" ]; then
  echo "IPFS hash cannot be empty."
  exit 1
fi

# Navigate to the directory containing the Dockerfile
cd "$(dirname "$0")/.."

# Build the Docker image
docker buildx build --platform=linux/amd64 -t ${DOCKER_USERNAME}/oar-memeooorr_eliza:${IPFS_HASH} .

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Docker image built successfully."
  echo "Image Name: ${DOCKER_USERNAME}/oar-memeooorr_eliza:${IPFS_HASH}"
  # Ask if user will push the image to Docker Hub
  read -p "Would you like to push the image to Docker Hub? (y/n): " PUSH_IMAGE
  if [ "$PUSH_IMAGE" == "y" ]; then
    docker push ${DOCKER_USERNAME}/oar-memeooorr_eliza:${IPFS_HASH}
    echo "Image pushed to Docker Hub."
  fi
else
  echo "Docker image build failed."
  exit 1
fi
