/**
 * Devil - Minecraft AFK Bot
 * Command handler implementation
 */

const logger = require('../utils/logger');
const antiAfk = require('../utils/antiAfk');
const sleepInBed = require('../utils/sleepInBed');
const config = require('../config');

// Store bot reference
let bot = null;

// Command handlers
const commands = {
  /**
   * Display help information
   */
  help: (username) => {
    const helpMessage = [
      'Devil Bot Commands:',
      '- help: Show this help message',
      '- status: Check bot status',
      '- come: Make the bot come to you',
      '- jump: Make the bot jump',
      '- say <message>: Make the bot say something',
      '- look <yaw> <pitch>: Make the bot look in a direction',
      '- restart: Restart the anti-AFK system',
      '- inventory: Show bot inventory',
      '- sleep: Make the bot find and sleep in a nearby bed'
    ].join('\n');
    
    bot.whisper(username, helpMessage);
    logger.info(`Sent help information to ${username}`);
  },
  
  /**
   * Report bot status
   */
  status: (username) => {
    if (!bot.entity) {
      bot.whisper(username, 'Bot is connecting or not fully spawned yet.');
      return;
    }
    
    const status = [
      `Health: ${bot.health.toFixed(1)}/${bot.food.toFixed(1)}`,
      `Position: ${bot.entity.position.x.toFixed(1)}, ${bot.entity.position.y.toFixed(1)}, ${bot.entity.position.z.toFixed(1)}`,
      `Time: ${bot.time.timeOfDay} (${bot.time.isDay ? 'day' : 'night'})`,
      `Weather: ${bot.isRaining ? 'raining' : 'clear'}`
    ].join(' | ');
    
    bot.whisper(username, `Status: ${status}`);
    logger.info(`Sent status to ${username}: ${status}`);
  },
  
  /**
   * Make the bot come to the player
   */
  come: (username) => {
    const player = bot.players[username];
    
    if (!player || !player.entity) {
      bot.whisper(username, 'I cannot see you! Get closer.');
      return;
    }
    
    const target = player.entity.position;
    
    bot.whisper(username, `Coming to you!`);
    bot.pathfinder.setGoal(new bot.pathfinder.goals.GoalNear(target.x, target.y, target.z, 2));
    
    logger.info(`Moving to ${username}'s position: ${target.x}, ${target.y}, ${target.z}`);
  },
  
  /**
   * Make the bot jump
   */
  jump: () => {
    bot.setControlState('jump', true);
    setTimeout(() => {
      bot.setControlState('jump', false);
    }, 500);
    logger.info('Bot jumped on command');
  },
  
  /**
   * Make the bot say something in chat
   */
  say: (username, args) => {
    const message = args.join(' ');
    if (!message) {
      bot.whisper(username, 'Please provide a message for me to say.');
      return;
    }
    
    // Prevent command injection
    if (message.startsWith('/')) {
      bot.whisper(username, 'I cannot execute commands.');
      return;
    }
    
    bot.chat(message);
    logger.info(`Said message for ${username}: ${message}`);
  },
  
  /**
   * Make the bot look in a specific direction
   */
  look: (username, args) => {
    const yaw = parseFloat(args[0]);
    const pitch = parseFloat(args[1]);
    
    if (isNaN(yaw) || isNaN(pitch)) {
      bot.whisper(username, 'Please provide valid yaw and pitch values (numbers).');
      return;
    }
    
    bot.look(yaw, pitch, false);
    bot.whisper(username, `Looking at yaw: ${yaw}, pitch: ${pitch}`);
    logger.info(`Changed look direction to yaw: ${yaw}, pitch: ${pitch}`);
  },
  
  /**
   * Restart the anti-AFK system
   */
  restart: (username) => {
    antiAfk.stopAntiAfk();
    antiAfk.startAntiAfk(bot);
    bot.whisper(username, 'Anti-AFK system restarted.');
    logger.info(`Anti-AFK system restarted by ${username}`);
  },
  
  /**
   * Show bot inventory
   */
  inventory: (username) => {
    const items = bot.inventory.items();
    
    if (items.length === 0) {
      bot.whisper(username, 'My inventory is empty.');
      return;
    }
    
    const itemList = items.map(item => `${item.name} x${item.count}`).join(', ');
    bot.whisper(username, `Inventory: ${itemList}`);
    logger.info(`Sent inventory list to ${username}`);
  },
  
  /**
   * Make the bot find and sleep in a bed
   */
  sleep: (username) => {
    if (bot.isSleeping) {
      bot.whisper(username, 'I am already sleeping in a bed.');
      return;
    }
    
    bot.whisper(username, 'Looking for a bed to sleep in...');
    
    // Check if it's night time (if not, tell the user but try anyway)
    if (bot.time && bot.time.timeOfDay < 13000 || bot.time.timeOfDay > 23000) {
      bot.whisper(username, "It's not night time yet, but I'll try to find a bed anyway.");
    }
    
    // Call the sleep in bed function
    sleepInBed.checkTimeAndSleep(bot);
    
    logger.info(`User ${username} requested bot to find and sleep in a bed`);
  }
};

/**
 * Initialize commands with a bot instance
 * @param {Object} botInstance - The Mineflayer bot instance
 */
function init(botInstance) {
  bot = botInstance;
  logger.info('Command handler initialized');
}

/**
 * Handle an incoming command
 * @param {string} username - Username who sent the command
 * @param {string} message - The command message
 * @param {boolean} isWhisper - Whether the command was sent via whisper
 */
function handleCommand(username, message, isWhisper) {
  // Check if user is allowed to use commands
  const isAllowed = config.ALLOWED_USERS.length === 0 || config.ALLOWED_USERS.includes(username);
  
  if (!isAllowed) {
    logger.warn(`User ${username} tried to use commands but is not in the allowed users list`);
    return;
  }
  
  const parts = message.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Execute command if it exists
  if (commands[command]) {
    logger.info(`User ${username} executed command: ${command}`);
    commands[command](username, args);
  } else if (isWhisper) {
    // If it's a whisper but not a valid command, send help
    bot.whisper(username, `Unknown command. Type 'help' for a list of commands.`);
  }
}

module.exports = {
  init,
  handleCommand
};
