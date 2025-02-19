# Use a specific Node.js version for better reproducibility
FROM node:23.6.0-slim AS builder

# Install pnpm globally and install necessary build tools
RUN npm install -g pnpm@9.15.1 && \
    apt-get update && \
    apt-get install -y git python3 make g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Python 3 as the default python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy package.json and other configuration files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY tsconfig.settings.json ./
COPY pnpm-workspace.yaml ./
COPY lerna.json ./

# Copy the rest of the application code
COPY ./agents-fun ./agents-fun
COPY ./packages ./packages
COPY ./scripts ./scripts

# Install dependencies and build the project
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Create dist directory and set permissions
RUN mkdir -p /app/dist && \
    chown -R node:node /app && \
    chmod -R 755 /app

# Switch to node user
USER node

# Create a new stage for the final image
FROM node:23.6.0-slim

# Install runtime dependencies if needed
RUN npm install -g pnpm@9.15.1
RUN apt-get update && \
    apt-get install -y git python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built artifacts and production dependencies from the builder stage
COPY --from=builder /app/lerna.json /app/
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/tsconfig.json /app/
COPY --from=builder /app/tsconfig.settings.json /app/
COPY --from=builder /app/pnpm-lock.yaml /app/
COPY --from=builder /app/pnpm-workspace.yaml /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/agents-fun /app/agents-fun
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/scripts /app/scripts

RUN chmod +x scripts/run.sh

EXPOSE 3000
# Set the command to run the application

ENTRYPOINT [ "/app/scripts/run.sh" ]

# Add health check
HEALTHCHECK --interval=30s --timeout=300s --start-period=50s --retries=30 CMD curl -f http://localhost:3000 || exit 1
