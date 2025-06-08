/**
 * Devil - Minecraft AFK Bot
 * Sleep in bed utility
 * 
 * This module handles the logic for the bot to find and sleep in the
 * nearest bed when it becomes nighttime in the game.
 */

const { goals } = require('mineflayer-pathfinder');
const logger = require('./logger');
const Vec3 = require('vec3').Vec3;

/**
 * Convert a directional vector to the corresponding direction number
 * used in the Minecraft protocol
 * @param {Vec3} faceVector - Vector indicating which face to place against
 * @returns {number} - Direction number for the protocol
 */
function vectorToDirection(faceVector) {
  if (faceVector.y > 0) return 1; // Top
  if (faceVector.y < 0) return 0; // Bottom
  if (faceVector.z > 0) return 3; // North
  if (faceVector.z < 0) return 2; // South
  if (faceVector.x > 0) return 5; // West
  if (faceVector.x < 0) return 4; // East
  return 0; // Default to bottom
}

// Constants
const CHECK_INTERVAL = 30000; // Check time every 30 seconds
const MAX_BED_SEARCH_DISTANCE = 20; // Maximum distance to search for beds
const SLEEP_ATTEMPT_TIMEOUT = 10000; // Time to wait before giving up on sleeping
let timeCheckInterval = null;
let currentSleepAttempt = null;
let isTryingToSleep = false;

/**
 * Start monitoring the time to sleep at night
 * @param {Object} bot - The Mineflayer bot instance
 */
function startNightTimeCheck(bot) {
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
  }
  
  logger.info('Starting night time bed monitoring');
  
  // Check time immediately on startup
  checkTimeAndSleep(bot);
  
  // Set up interval to check time regularly
  timeCheckInterval = setInterval(() => {
    checkTimeAndSleep(bot);
  }, CHECK_INTERVAL);
  
  // Also listen for time changes
  bot.on('time', () => {
    // Only check occasionally based on tick count to avoid too frequent checks
    if (bot.time.timeOfDay % 6000 === 0) { // Check every 5 minutes of game time
      checkTimeAndSleep(bot);
    }
  });
}

/**
 * Stop monitoring the time
 */
function stopNightTimeCheck() {
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
    timeCheckInterval = null;
    logger.info('Stopped night time bed monitoring');
  }
  
  if (currentSleepAttempt) {
    clearTimeout(currentSleepAttempt);
    currentSleepAttempt = null;
  }
  
  isTryingToSleep = false;
}

/**
 * Check if it's night time and try to sleep if it is
 * @param {Object} bot - The Mineflayer bot instance
 */
function checkTimeAndSleep(bot) {
  // Don't check if the bot is already trying to sleep
  if (isTryingToSleep) return;
  
  try {
    if (!bot || !bot.time) {
      logger.warn('Cannot check time - bot not fully initialized');
      return;
    }
    
    // Minecraft time is based on ticks, where a full day is 24000 ticks
    // Night time is roughly from 13000 to 23000
    const timeOfDay = bot.time.timeOfDay;
    
    // Check if it's night time and player can sleep
    if (timeOfDay >= 13000 && timeOfDay <= 23000) {
      logger.info(`It's night time (time: ${timeOfDay}). Looking for a bed to sleep in...`);
      findAndSleepInBed(bot);
    } else {
      // If the bot is already sleeping, but it's not night anymore, get out of bed
      if (bot.isSleeping) {
        logger.info("It's daytime, bot is getting out of bed");
        bot.wake();
      }
    }
  } catch (error) {
    logger.error(`Error checking time or sleeping: ${error.message}`);
  }
}

/**
 * Find the nearest bed and try to sleep in it
 * @param {Object} bot - The Mineflayer bot instance
 */
function findAndSleepInBed(bot) {
  isTryingToSleep = true;
  
  try {
    // First check if we're already in a bed
    if (bot.isSleeping) {
      logger.info('Bot is already sleeping in a bed');
      isTryingToSleep = false;
      return;
    }
    
    // Find all bed blocks nearby
    const mcData = require('minecraft-data')(bot.version);
    const bedBlockNames = ['bed', 'white_bed', 'orange_bed', 'magenta_bed', 'light_blue_bed',
                           'yellow_bed', 'lime_bed', 'pink_bed', 'gray_bed', 'light_gray_bed',
                           'cyan_bed', 'purple_bed', 'blue_bed', 'brown_bed', 'green_bed',
                           'red_bed', 'black_bed'];
    
    // Get all possible bed block IDs
    const bedIds = bedBlockNames.map(name => mcData.blocksByName[name]?.id).filter(id => id !== undefined);
    
    if (bedIds.length === 0) {
      logger.warn('No bed blocks found in this Minecraft version');
      isTryingToSleep = false;
      return;
    }
    
    // Find the nearest bed block
    const bed = bot.findBlock({
      matching: bedIds,
      maxDistance: MAX_BED_SEARCH_DISTANCE
    });
    
    if (!bed) {
      logger.info(`No bed found within ${MAX_BED_SEARCH_DISTANCE} blocks, checking inventory for bed items...`);
      
      // Check if the bot has a bed in inventory to place
      tryToPlaceBed(bot, mcData, bedBlockNames);
      return;
    }
    
    logger.info(`Found a bed at ${bed.position.toString()}, moving to it...`);
    
    // Move to the bed and try to sleep in it
    try {
      const goal = new goals.GoalBlock(bed.position.x, bed.position.y, bed.position.z);
      bot.pathfinder.setGoal(goal);
      
      // Use a safer way to handle goal reached without relying on events
      // Monitor position and check if we've reached near the bed
      const checkInterval = setInterval(() => {
        if (!bot.pathfinder.isMoving()) {
          clearInterval(checkInterval);
          
          // We've reached the bed or gotten as close as we can
          logger.info('Reached near the bed, attempting to sleep...');
          
          // Try to sleep in the bed using right-click
          try {
            logger.info('Right-clicking on the bed to sleep...');
            // Use bot.activateBlock which is a right-click action
            bot.activateBlock(bed).then(() => {
              logger.info('Bot is now sleeping in the bed');
              isTryingToSleep = false;
            }).catch(error => {
              logger.error(`Error right-clicking bed: ${error.message}`);
              // Fall back to the sleep function as a second option
              bot.sleep(bed).then(() => {
                logger.info('Bot is now sleeping in the bed (via sleep function)');
                isTryingToSleep = false;
              }).catch(secondError => {
                logger.error(`Error with fallback sleep method: ${secondError.message}`);
                isTryingToSleep = false;
              });
            });
          } catch (error) {
            logger.error(`Error attempting to right-click bed: ${error.message}`);
            isTryingToSleep = false;
          }
        }
      }, 1000);
      
      // Set up a timeout in case sleeping fails
      currentSleepAttempt = setTimeout(() => {
        clearInterval(checkInterval);
        if (!bot.isSleeping) {
          logger.warn('Failed to sleep in bed, will try again later');
          isTryingToSleep = false;
        }
      }, SLEEP_ATTEMPT_TIMEOUT);
      
    } catch (error) {
      logger.error(`Error with pathfinding to bed: ${error.message}`);
      // Fall back to simple movement
      logger.info('Falling back to simple movement toward bed');
      
      // Simple approach - just move in the direction of the bed
      const playerPos = bot.entity.position;
      const bedPos = bed.position;
      const direction = bedPos.minus(playerPos).normalize();
      
      bot.setControlState('forward', true);
      bot.lookAt(bedPos);
      
      // After a few seconds, try to sleep
      setTimeout(() => {
        bot.setControlState('forward', false);
        
        // Try to sleep in the bed (right-click)
        try {
          logger.info('Right-clicking on the bed to sleep...');
          // Use bot.activateBlock which is a right-click action
          bot.activateBlock(bed).then(() => {
            logger.info('Bot is now sleeping in the bed');
            isTryingToSleep = false;
          }).catch(error => {
            logger.error(`Error right-clicking bed: ${error.message}`);
            // Fall back to the sleep function as a second option
            bot.sleep(bed).then(() => {
              logger.info('Bot is now sleeping in the bed (via sleep function)');
              isTryingToSleep = false;
            }).catch(secondError => {
              logger.error(`Error with fallback sleep method: ${secondError.message}`);
              isTryingToSleep = false;
            });
          });
        } catch (error) {
          logger.error(`Error attempting to right-click bed: ${error.message}`);
          isTryingToSleep = false;
        }
      }, 5000);
    }
    
  } catch (error) {
    logger.error(`Error finding or sleeping in bed: ${error.message}`);
    isTryingToSleep = false;
  }
}

/**
 * Try to place a bed from the bot's inventory
 * @param {Object} bot - The Mineflayer bot instance
 * @param {Object} mcData - Minecraft data
 * @param {Array} bedBlockNames - Array of bed block names
 */
function tryToPlaceBed(bot, mcData, bedBlockNames) {
  try {
    // Check inventory for bed items
    const bedItemNames = bedBlockNames.map(name => name === 'bed' ? 'bed' : name);
    let bedItem = null;
    
    // Find a bed in inventory
    for (const name of bedItemNames) {
      const item = bot.inventory.items().find(item => 
        item.name === name || 
        (mcData.itemsByName[name] && item.type === mcData.itemsByName[name].id)
      );
      
      if (item) {
        bedItem = item;
        logger.info(`Found ${item.name} in inventory, will try to place it`);
        break;
      }
    }
    
    if (!bedItem) {
      logger.warn('No bed found in inventory');
      isTryingToSleep = false;
      return;
    }
    
    // Look for a suitable location to place the bed
    findSuitableLocationAndPlaceBed(bot, bedItem);
    
  } catch (error) {
    logger.error(`Error checking inventory for bed: ${error.message}`);
    isTryingToSleep = false;
  }
}

/**
 * Find a suitable location and place a bed
 * @param {Object} bot - The Mineflayer bot instance
 * @param {Object} bedItem - The bed item from inventory
 */
function findSuitableLocationAndPlaceBed(bot, bedItem) {
  try {
    logger.info('Looking for a suitable location to place the bed...');
    
    // Get current position
    const playerPos = bot.entity.position.floored();
    
    // Check current block and blocks nearby for a suitable place
    const offsets = [
      { x: 0, y: 0, z: 0 },   // Current position
      { x: 1, y: 0, z: 0 },   // East
      { x: -1, y: 0, z: 0 },  // West
      { x: 0, y: 0, z: 1 },   // South
      { x: 0, y: 0, z: -1 },  // North
    ];
    
    let suitableLocation = null;
    let placementDirection = null;
    
    // Check each location
    for (const offset of offsets) {
      const pos = playerPos.offset(offset.x, offset.y, offset.z);
      
      // Check if this position and the adjacent block is suitable for a bed
      const directions = [
        { x: 1, y: 0, z: 0 },   // East
        { x: -1, y: 0, z: 0 },  // West
        { x: 0, y: 0, z: 1 },   // South
        { x: 0, y: 0, z: -1 },  // North
      ];
      
      for (const dir of directions) {
        const secondPos = pos.offset(dir.x, dir.y, dir.z);
        
        // Check if both positions are empty and have solid blocks below
        const canPlaceHere = canPlaceBedAt(bot, pos, secondPos);
        
        if (canPlaceHere) {
          suitableLocation = pos;
          placementDirection = dir;
          break;
        }
      }
      
      if (suitableLocation) break;
    }
    
    if (!suitableLocation || !placementDirection) {
      logger.warn('Could not find suitable location to place bed');
      isTryingToSleep = false;
      return;
    }
    
    logger.info(`Found suitable location at ${suitableLocation.toString()}, attempting to place bed...`);
    
    // Equip the bed
    bot.equip(bedItem, 'hand').then(() => {
      // Move very close to the placement location if needed
      const moveGoal = new goals.GoalNear(suitableLocation.x, suitableLocation.y, suitableLocation.z, 2);
      bot.pathfinder.setGoal(moveGoal);
      
      // Wait a moment, then place the bed
      setTimeout(() => {
        // Look at the placement location
        const placementBlock = bot.blockAt(suitableLocation);
        
        if (!placementBlock) {
          logger.error('Unable to find placement block');
          isTryingToSleep = false;
          return;
        }
        
        // Calculate the direction to look
        let yaw = 0;
        if (placementDirection.x > 0) yaw = 1.5 * Math.PI; // East
        else if (placementDirection.x < 0) yaw = 0.5 * Math.PI; // West
        else if (placementDirection.z > 0) yaw = Math.PI; // South
        else if (placementDirection.z < 0) yaw = 0; // North
        
        // Look in the appropriate direction
        bot.look(yaw, 0).then(() => {
          try {
            logger.info('Attempting to place bed using standard method...');
            
            // Use the standard placeBlock method with proper reference
            const blockBelow = bot.blockAt(suitableLocation.offset(0, -1, 0));
            
            if (!blockBelow) {
              logger.error('Block below placement location not found');
              isTryingToSleep = false;
              return;
            }
            
            // Place the bed on top of the block below
            bot.placeBlock(blockBelow, new Vec3(0, 1, 0)).then(() => {
              logger.info('Successfully placed the bed using standard method!');
              
              // Wait a moment for the block to be properly placed
              setTimeout(() => {
                // Find the bed we just placed
                const placedBed = bot.findBlock({
                  matching: block => {
                    return block.name && block.name.includes('bed');
                  },
                  maxDistance: 10
                });
                
                if (placedBed) {
                  logger.info(`Found placed bed at ${placedBed.position.toString()}, attempting to sleep...`);
                  
                  // Try to sleep in the bed using right-click
                  try {
                    logger.info('Right-clicking on the placed bed to sleep...');
                    // Use bot.activateBlock which is a right-click action
                    bot.activateBlock(placedBed).then(() => {
                      logger.info('Bot is now sleeping in the bed it placed');
                      isTryingToSleep = false;
                    }).catch(error => {
                      logger.error(`Error right-clicking placed bed: ${error.message}`);
                      // Fall back to the sleep function as a second option
                      bot.sleep(placedBed).then(() => {
                        logger.info('Bot is now sleeping in the bed it placed (via sleep function)');
                        isTryingToSleep = false;
                      }).catch(secondError => {
                        logger.error(`Error with fallback sleep method: ${secondError.message}`);
                        isTryingToSleep = false;
                      });
                    });
                  } catch (error) {
                    logger.error(`Error attempting to right-click placed bed: ${error.message}`);
                    isTryingToSleep = false;
                  }
                } else {
                  logger.warn('Could not find the bed that was just placed');
                  isTryingToSleep = false;
                }
              }, 1000);
            }).catch(error => {
              logger.error(`Error placing bed: ${error.message}`);
              logger.info('Will skip bed placement and continue with anti-AFK');
              isTryingToSleep = false;
            });
            
          } catch (error) {
            logger.error(`Error during bed placement: ${error.message}`);
            isTryingToSleep = false;
          }
        });
      }, 2000);
    }).catch(error => {
      logger.error(`Error equipping bed: ${error.message}`);
      isTryingToSleep = false;
    });
    
  } catch (error) {
    logger.error(`Error finding location to place bed: ${error.message}`);
    isTryingToSleep = false;
  }
}

/**
 * Check if a bed can be placed at the given positions
 * @param {Object} bot - The Mineflayer bot instance
 * @param {Object} pos1 - First position
 * @param {Object} pos2 - Second position (adjacent for bed head)
 * @returns {boolean} - Whether a bed can be placed here
 */
function canPlaceBedAt(bot, pos1, pos2) {
  try {
    // Check if both positions are empty (air or replaceable)
    const block1 = bot.blockAt(pos1);
    const block2 = bot.blockAt(pos2);
    
    if (!block1 || !block2) return false;
    
    const isEmpty1 = block1.name === 'air' || block1.material === 'plant';
    const isEmpty2 = block2.name === 'air' || block2.material === 'plant';
    
    if (!isEmpty1 || !isEmpty2) return false;
    
    // Check if there are solid blocks below both positions
    const blockBelow1 = bot.blockAt(pos1.offset(0, -1, 0));
    const blockBelow2 = bot.blockAt(pos2.offset(0, -1, 0));
    
    if (!blockBelow1 || !blockBelow2) return false;
    
    const isSupporting1 = blockBelow1.material !== 'air' && 
                         blockBelow1.material !== 'plant' && 
                         blockBelow1.material !== 'liquid';
    const isSupporting2 = blockBelow2.material !== 'air' && 
                         blockBelow2.material !== 'plant' && 
                         blockBelow2.material !== 'liquid';
    
    return isSupporting1 && isSupporting2;
  } catch (error) {
    logger.error(`Error checking if bed can be placed: ${error.message}`);
    return false;
  }
}

module.exports = { 
  startNightTimeCheck,
  stopNightTimeCheck,
  checkTimeAndSleep
};