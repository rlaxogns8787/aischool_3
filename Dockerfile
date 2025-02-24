FROM node:18

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files from travel directory
COPY travel/package.json travel/yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application from travel directory
COPY travel/ .

# Expose Expo ports
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Set environment variables
ENV REACT_NATIVE_PACKAGER_HOSTNAME="0.0.0.0"
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"

# Start command will be provided in docker-compose.yml 