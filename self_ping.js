/**
 * Devil - Minecraft AFK Bot
 * Self-pinging script to keep the bot running 24/7
 * 
 * This script uses node-cron to set up a job that pings the bot's own
 * HTTP server at regular intervals, keeping it active even without
 * external uptime services.
 */

const cron = require('node-cron');
const http = require('http');
const logger = require('./utils/logger');

// Schedule a task to run every 5 minutes
logger.info('Setting up self-ping mechanism to stay active 24/7');

// Function to ping our own server
function pingOurself() {
  const options = {
    host: 'localhost',
    port: 8080,
    path: '/self-ping'
  };

  http.get(options, (res) => {
    const { statusCode } = res;
    
    if (statusCode !== 200) {
      logger.warn(`Self-ping failed with status code: ${statusCode}`);
      return;
    }

    logger.info('Self-ping successful, keeping bot active');
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      logger.debug(`Self-ping response: ${data}`);
    });
  }).on('error', (err) => {
    logger.error(`Self-ping error: ${err.message}`);
  });
}

// Run immediately once and then on schedule
pingOurself();

// Schedule to run every 5 minutes
cron.schedule('*/5 * * * *', pingOurself);

logger.info('Self-ping mechanism is active and running every 5 minutes');

// Export for use in index.js
module.exports = { pingOurself };