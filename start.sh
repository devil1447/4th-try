#!/bin/bash

# Check if logs directory exists and create it if not
if [ ! -d "./logs" ]; then
  mkdir -p ./logs
  echo "Created logs directory"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "./node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the bot with PM2
echo "Starting Devil Minecraft AFK Bot with PM2..."
npx pm2 start ecosystem.config.js

# Display running processes
echo "Running processes:"
npx pm2 list

# Monitor logs
echo "Monitoring logs (press Ctrl+C to exit monitoring):"
npx pm2 logs