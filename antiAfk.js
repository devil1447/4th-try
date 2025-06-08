/**
 * Devil - Minecraft AFK Bot
 * Anti-AFK measures to prevent timeout kicks
 */

const { Vec3 } = require('vec3');
const config = require('../config');
const logger = require('./logger');

// Store interval IDs to clear them if needed
const intervals = {
  rotation: null,
  jump: null,
  armSwing: null,
  movement: null,
  sneak: null,
  mainLoop: null
};

/**
 * Start anti-AFK measures to prevent the bot from being kicked
 * @param {Object} bot - The Mineflayer bot instance
 */
function startAntiAfk(bot) {
  logger.info('Starting anti-AFK measures');
  
  // Clear any existing intervals
  stopAntiAfk();
  
  // Implement random looking around (rotation)
  intervals.rotation = setInterval(() => {
    randomLook(bot);
  }, config.ROTATION_INTERVAL);
  
  // Implement random jumping
  intervals.jump = setInterval(() => {
    if (Math.random() > 0.5) { // 50% chance to jump
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 500);
      logger.debug('Anti-AFK: Jumped');
    }
  }, config.JUMP_INTERVAL);
  
  // Implement random arm swinging
  intervals.armSwing = setInterval(() => {
    if (Math.random() > 0.3) { // 70% chance to swing arm
      bot.swingArm();
      logger.debug('Anti-AFK: Swung arm');
    }
  }, config.ARM_SWING_INTERVAL);
  
  // Implement random sneaking
  intervals.sneak = setInterval(() => {
    if (Math.random() > 0.7) { // 30% chance to sneak
      bot.setControlState('sneak', true);
      setTimeout(() => {
        bot.setControlState('sneak', false);
      }, 1500);
      logger.debug('Anti-AFK: Sneaked');
    }
  }, config.SNEAK_INTERVAL);
  
  // Main anti-AFK loop
  intervals.mainLoop = setInterval(() => {
    performAntiAfkAction(bot);
  }, config.ANTI_AFK_INTERVAL);
  
  logger.info('Anti-AFK measures activated');
}

/**
 * Stop all anti-AFK measures
 */
function stopAntiAfk() {
  Object.values(intervals).forEach(interval => {
    if (interval) clearInterval(interval);
  });
  
  // Reset all intervals
  Object.keys(intervals).forEach(key => {
    intervals[key] = null;
  });
  
  logger.info('Anti-AFK measures deactivated');
}

/**
 * Perform a random anti-AFK action
 * @param {Object} bot - The Mineflayer bot instance
 */
function performAntiAfkAction(bot) {
  // Exit if bot is not spawned yet
  if (!bot.entity) return;
  
  const actionRoll = Math.random();
  
  // Check if we're stuck and need to take more drastic actions
  checkIfStuck(bot);
  
  if (actionRoll < 0.15) {
    // 15% chance - Simple rotation
    randomLook(bot);
    logger.debug('Anti-AFK: Random look');
  } else if (actionRoll < 0.3) {
    // 15% chance - Jump
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
    logger.debug('Anti-AFK: Jump');
  } else if (actionRoll < 0.45) {
    // 15% chance - Swing arm
    bot.swingArm();
    logger.debug('Anti-AFK: Swing arm');
  } else if (actionRoll < 0.85) {
    // 40% chance - Random movement (simple or complex)
    smallRandomMovement(bot);
    logger.debug('Anti-AFK: Random movement');
  } else if (actionRoll < 0.95) {
    // 10% chance - Sneak briefly
    bot.setControlState('sneak', true);
    setTimeout(() => bot.setControlState('sneak', false), 1000);
    logger.debug('Anti-AFK: Sneak');
  } else {
    // 5% chance - Combined actions (extra complex to avoid pattern detection)
    logger.debug('Anti-AFK: Combined actions');
    
    // Look around
    randomLook(bot);
    
    // Random movement after looking
    setTimeout(() => {
      smallRandomMovement(bot);
      
      // Jump at the end of movement
      setTimeout(() => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 250);
        
        // Maybe sneak after landing
        if (Math.random() > 0.5) {
          setTimeout(() => {
            bot.setControlState('sneak', true);
            setTimeout(() => bot.setControlState('sneak', false), 750);
          }, 350);
        }
        
        // Swing arm to finish
        setTimeout(() => {
          bot.swingArm();
        }, 1200);
      }, 500);
    }, 300);
  }
}

/**
 * Make the bot look in a random direction
 * @param {Object} bot - The Mineflayer bot instance
 */
function randomLook(bot) {
  const yaw = Math.random() * Math.PI * 2; // 0 to 2π
  const pitch = (Math.random() - 0.5) * Math.PI; // -π/2 to π/2
  bot.look(yaw, pitch, false);
}

/**
 * Make the bot perform a small random movement
 * @param {Object} bot - The Mineflayer bot instance
 */
function smallRandomMovement(bot) {
  // Exit if bot is not spawned yet
  if (!bot.entity) return;
  
  // Stop any current movements
  ['forward', 'back', 'left', 'right'].forEach(control => {
    bot.setControlState(control, false);
  });
  
  // Decide on movement complexity (simple or complex pattern)
  if (Math.random() < 0.7) { // 70% chance for simple movement
    // Select a random direction
    const directions = ['forward', 'back', 'left', 'right'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    // Move briefly in that direction
    bot.setControlState(direction, true);
    
    // Stop after a short duration (0.5 to 1.5 seconds)
    const duration = 500 + Math.random() * 1000;
    setTimeout(() => {
      bot.setControlState(direction, false);
    }, duration);
  } else { // 30% chance for complex movement pattern
    // Complex movement - combination of directions, jumping, or diagonal
    const complexity = Math.floor(Math.random() * 4);
    
    switch (complexity) {
      case 0: // Diagonal movement (forward + left/right)
        bot.setControlState('forward', true);
        bot.setControlState(Math.random() > 0.5 ? 'left' : 'right', true);
        setTimeout(() => {
          bot.setControlState('forward', false);
          bot.setControlState('left', false);
          bot.setControlState('right', false);
        }, 800 + Math.random() * 1200);
        break;
        
      case 1: // Zig-zag pattern
        bot.setControlState('forward', true);
        
        // Left after delay
        setTimeout(() => {
          bot.setControlState('left', true);
        }, 300);
        
        // Stop left, go right
        setTimeout(() => {
          bot.setControlState('left', false);
          bot.setControlState('right', true);
        }, 600);
        
        // Stop all
        setTimeout(() => {
          bot.setControlState('forward', false);
          bot.setControlState('right', false);
        }, 1000 + Math.random() * 500);
        break;
        
      case 2: // Jump while moving
        bot.setControlState('forward', true);
        bot.setControlState('jump', true);
        
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 400);
        
        setTimeout(() => {
          bot.setControlState('forward', false);
        }, 600 + Math.random() * 800);
        break;
        
      case 3: // Circle-like movement
        // Start forward and left
        bot.setControlState('forward', true);
        bot.setControlState('left', true);
        
        // After delay, switch to right
        setTimeout(() => {
          bot.setControlState('left', false);
          bot.setControlState('right', true);
        }, 400 + Math.random() * 200);
        
        // Final stop
        setTimeout(() => {
          bot.setControlState('forward', false);
          bot.setControlState('right', false);
        }, 1000 + Math.random() * 500);
        break;
    }
  }
}

/**
 * Check if the bot is stuck and attempt to free it
 * @param {Object} bot - The Mineflayer bot instance
 */
function checkIfStuck(bot) {
  // Store the current position for comparison
  if (!bot.entity) return;
  
  const currentPosition = bot.entity.position.clone();
  const lastPos = bot._lastPosition || currentPosition;
  
  // Save this position for next check
  bot._lastPosition = currentPosition;
  
  // Calculate distance moved since last check
  const distanceMoved = lastPos.distanceTo(currentPosition);
  
  // If we've barely moved for multiple checks, try to free the bot
  if (distanceMoved < 0.02) { // Almost no movement
    bot._stuckCounter = (bot._stuckCounter || 0) + 1;
    
    // If we've been stuck for several checks, take action
    if (bot._stuckCounter >= 3) {
      logger.warn('Bot appears to be stuck, attempting advanced freedom maneuvers');
      
      // Reset stuck counter
      bot._stuckCounter = 0;
      
      // Try to break free with a series of movements
      
      // First, look in a random direction
      randomLook(bot);
      
      // Try jumping while moving
      bot.setControlState('jump', true);
      
      // Pick random direction
      const directions = ['forward', 'back', 'left', 'right'];
      const primaryDir = directions[Math.floor(Math.random() * directions.length)];
      const secondaryDir = directions[Math.floor(Math.random() * directions.length)];
      
      // Move in primary direction
      bot.setControlState(primaryDir, true);
      
      // After a delay, try secondary movement
      setTimeout(() => {
        bot.setControlState('jump', false);
        bot.setControlState(primaryDir, false);
        bot.setControlState(secondaryDir, true);
        
        // Try another jump
        setTimeout(() => {
          bot.setControlState('jump', true);
          setTimeout(() => bot.setControlState('jump', false), 200);
        }, 250);
        
        // Finally stop all movement
        setTimeout(() => {
          bot.setControlState(secondaryDir, false);
          
          // For good measure, try to look straight up (can help if stuck in certain blocks)
          bot.look(bot.entity.yaw, -Math.PI/2, false);
          
          // One more jump attempt
          setTimeout(() => {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 300);
          }, 200);
        }, 800);
      }, 500);
    }
  } else {
    // Reset stuck counter if we're moving
    bot._stuckCounter = 0;
  }
}

module.exports = {
  startAntiAfk,
  stopAntiAfk,
  performAntiAfkAction,
  randomLook,
  smallRandomMovement,
  checkIfStuck
};
