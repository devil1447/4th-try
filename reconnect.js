/**
 * Devil - Minecraft AFK Bot
 * Reconnection logic utility
 */

const logger = require('./logger');

/**
 * Calculate the delay before attempting reconnection
 * Uses exponential backoff with jitter
 * 
 * @param {number} attempt - Current reconnection attempt
 * @returns {number} - Delay in milliseconds
 */
function calculateReconnectDelay(attempt) {
  // Base delay is 5 seconds
  const baseDelay = 5000;
  
  // Calculate exponential backoff (up to ~5 minutes)
  const maxDelay = 300000; // 5 minutes
  const exponentialDelay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), maxDelay);
  
  // Add jitter (±20% randomness)
  const jitter = 0.2;
  const randomFactor = 1 - jitter + (Math.random() * jitter * 2);
  const finalDelay = Math.floor(exponentialDelay * randomFactor);
  
  logger.debug(`Calculated reconnect delay: ${finalDelay}ms (attempt ${attempt})`);
  return finalDelay;
}

/**
 * Check if the disconnect reason suggests a temporary server issue
 * 
 * @param {string} reason - Disconnect reason
 * @returns {boolean} - True if it's a temporary issue
 */
function isTemporaryIssue(reason) {
  const temporaryPatterns = [
    /connection reset/i,
    /connection refused/i,
    /connection timed out/i,
    /server is full/i,
    /internal server error/i,
    /server closed/i,
    /server restarting/i,
    /maintenance/i,
    /rate limit/i,
    /too many connections/i
  ];
  
  return temporaryPatterns.some(pattern => pattern.test(reason));
}

module.exports = {
  calculateReconnectDelay,
  isTemporaryIssue
};
