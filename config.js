/**
 * Devil - Minecraft AFK Bot
 * Configuration settings
 */

require('dotenv').config();

// Server and bot configuration
const config = {
  // Server details
  SERVER_HOST: process.env.SERVER_HOST || 'DevilGod1447.aternos.me',
  SERVER_PORT: parseInt(process.env.SERVER_PORT || '64211', 10),
  
  // Bot details
  USERNAME: process.env.USERNAME || 'Devil',
  AUTH_TYPE: process.env.AUTH_TYPE || 'offline',
  MINECRAFT_VERSION: process.env.MINECRAFT_VERSION || '1.21.5',
  
  // Bot behavior
  ANNOUNCE_LOGIN: process.env.ANNOUNCE_LOGIN === 'true' || false,
  LOGIN_MESSAGE: process.env.LOGIN_MESSAGE || 'Devil AFK bot is now active',
  
  // Anti-AFK settings
  ANTI_AFK_INTERVAL: parseInt(process.env.ANTI_AFK_INTERVAL || '60000', 10), // 1 minute
  ROTATION_INTERVAL: parseInt(process.env.ROTATION_INTERVAL || '30000', 10), // 30 seconds
  JUMP_INTERVAL: parseInt(process.env.JUMP_INTERVAL || '120000', 10), // 2 minutes
  ARM_SWING_INTERVAL: parseInt(process.env.ARM_SWING_INTERVAL || '90000', 10), // 1.5 minutes
  SNEAK_INTERVAL: parseInt(process.env.SNEAK_INTERVAL || '180000', 10), // 3 minutes
  
  // Command settings
  ALLOWED_USERS: (process.env.ALLOWED_USERS || '')
    .split(',')
    .map(user => user.trim())
    .filter(user => user.length > 0),
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
