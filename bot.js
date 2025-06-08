/**
 * Devil - Minecraft AFK Bot
 * Main bot implementation file
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const logger = require('./utils/logger');
const config = require('./config');
const reconnect = require('./utils/reconnect');
const antiAfk = require('./utils/antiAfk');
const sleepInBed = require('./utils/sleepInBed');
const commands = require('./commands');

let bot = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Create and start a new bot instance
 */
function startBot() {
  logger.info(`Connecting to ${config.SERVER_HOST}:${config.SERVER_PORT} as ${config.USERNAME}...`);
  
  try {
    // Create new bot instance
    bot = mineflayer.createBot({
      host: config.SERVER_HOST,
      port: config.SERVER_PORT,
      username: config.USERNAME,
      version: config.MINECRAFT_VERSION,
      auth: config.AUTH_TYPE,
      hideErrors: false,
    });

    // Add pathfinder plugin
    bot.loadPlugin(pathfinder);

    // Initialize bot events
    setupBotEvents();
    
    // Initialize commands
    commands.init(bot);
    
    // Reset reconnect attempts on successful connection
    reconnectAttempts = 0;
  } catch (error) {
    logger.error(`Error creating bot: ${error.message}`);
    handleReconnect();
  }
  
  return bot;
}

/**
 * Set up bot event handlers
 */
function setupBotEvents() {
  // Spawn event
  bot.on('spawn', () => {
    logger.info('Bot has spawned in the world');
    antiAfk.startAntiAfk(bot);
    
    // Initialize pathfinder movements
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    
    // Start the bed sleeping night time check
    sleepInBed.startNightTimeCheck(bot);
    logger.info('Bed sleeping feature activated - bot will sleep in nearby beds at night');
  });
  
  // Login event
  bot.on('login', () => {
    logger.info(`Successfully logged in as ${bot.username}`);
    
    // Send initial chat message to announce presence
    if (config.ANNOUNCE_LOGIN) {
      setTimeout(() => {
        try {
          // Make sure the bot is properly initialized before trying to chat
          if (bot && bot.chat && typeof bot.chat === 'function') {
            bot.chat(config.LOGIN_MESSAGE);
          } else {
            logger.warn('Cannot send login message: bot.chat not available yet');
          }
        } catch (e) {
          logger.error(`Error sending login message: ${e.message}`);
        }
      }, 5000); // Longer delay to ensure full connection
    }
  });
  
  // Error event
  bot.on('error', (err) => {
    logger.error(`Bot encountered an error: ${err.message}`);
    // Reconnect logic will be handled by 'end' event
  });
  
  // Kicked event
  bot.on('kicked', (reason) => {
    let formattedReason;
    try {
      // Try to parse JSON reason
      const parsedReason = JSON.parse(reason);
      formattedReason = parsedReason.text || reason;
    } catch (e) {
      // If parsing fails, use the raw reason
      formattedReason = reason;
    }
    logger.warn(`Bot was kicked from the server. Reason: ${formattedReason}`);
    handleReconnect();
  });
  
  // End event
  bot.on('end', (reason) => {
    logger.warn(`Bot disconnected from the server. Reason: ${reason}`);
    handleReconnect();
  });
  
  // Health event
  bot.on('health', () => {
    if (bot.health < 5) {
      logger.warn(`Bot health is low: ${bot.health}`);
    }
  });
  
  // Private message event
  bot.on('whisper', (username, message) => {
    logger.info(`Whisper from ${username}: ${message}`);
    
    // Process commands from whitelisted users
    if (config.ALLOWED_USERS.includes(username)) {
      commands.handleCommand(username, message, true);
    }
  });
  
  // Chat message event
  bot.on('chat', (username, message) => {
    // Ignore own messages
    if (username === bot.username) return;
    
    logger.info(`Chat from ${username}: ${message}`);
    
    // Check if message is directed to the bot
    if (message.startsWith(`${bot.username}`) || message.toLowerCase().startsWith('devil')) {
      commands.handleCommand(username, message.split(' ').slice(1).join(' '), false);
    }
  });
  
  // Setup rain detection
  bot.on('rain', () => {
    if (bot.isRaining) {
      logger.info('It started raining');
    } else {
      logger.info('It stopped raining');
    }
  });
  
  // Setup plugin-related events (for Villager in a Bucket compatibility)
  bot.on('messagestr', (message) => {
    // Listen for messages related to "Villager in a Bucket" plugin
    if (message.includes('villager') && message.includes('bucket')) {
      logger.info(`Villager in a Bucket event detected: ${message}`);
    }
  });
}

/**
 * Handle reconnection logic
 */
function handleReconnect() {
  // Save the last disconnect reason to detect patterns
  const lastDisconnectReason = bot && bot.lastDisconnectReason ? bot.lastDisconnectReason : '';
  
  // Check if we have a throttling message (specifically for Aternos servers)
  const isThrottled = lastDisconnectReason.includes('throttled') || 
                     lastDisconnectReason.includes('wait before reconnecting');
  
  // Special handling for Aternos throttling
  if (isThrottled) {
    logger.warn("Detected Aternos connection throttling, applying extended cooldown...");
    
    // For Aternos, we need a much longer cooldown (10-15 minutes)
    const aternosCooldown = 600000 + Math.floor(Math.random() * 300000); // 10-15 minutes
    logger.info(`Waiting ${Math.floor(aternosCooldown / 60000)} minutes before attempting to reconnect to Aternos server...`);
    
    // Reset counter and wait
    reconnectAttempts = 0;
    
    // Check if the server is likely offline by looking at connection patterns
    if (lastDisconnectReason.includes('throttled') || lastDisconnectReason.includes('Connection refused')) {
      logger.warn("Aternos server appears to be offline. Will attempt reconnection with longer intervals.");
      logger.info("Make sure your Aternos server is started at: https://aternos.org/server/");
    }
    
    setTimeout(() => {
      logger.info("Aternos cooldown complete, attempting to reconnect now");
      startBot();
    }, aternosCooldown);
    
    return;
  }
  
  // Normal reconnection logic
  reconnectAttempts++;
  
  // Apply extended delays after multiple quick failures
  if (reconnectAttempts > 3) {
    const extendedDelay = 60000 + Math.floor(Math.random() * 120000); // 1-3 minutes
    logger.warn(`Multiple reconnection failures, waiting ${Math.floor(extendedDelay / 60000)} minutes before next attempt...`);
    
    setTimeout(() => {
      logger.info("Extended cooldown complete, attempting to reconnect");
      startBot();
    }, extendedDelay);
    
    return;
  }
  
  // Standard reconnection with backoff
  if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
    const delay = reconnect.calculateReconnectDelay(reconnectAttempts);
    logger.info(`Attempting to reconnect in ${delay / 1000} seconds (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
      startBot();
    }, delay);
  } else {
    logger.error(`Exceeded maximum reconnect attempts (${MAX_RECONNECT_ATTEMPTS}). Stopping bot.`);
    process.exit(1);
  }
}

module.exports = { startBot };
