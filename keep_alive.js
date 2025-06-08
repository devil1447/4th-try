/**
 * Devil - Minecraft AFK Bot
 * Keep-alive script to maintain free 24/7 hosting
 * 
 * This script creates a basic HTTP server that can be pinged by
 * free uptime monitoring services to keep the Replit project alive.
 */

const http = require('http');
const logger = require('./utils/logger');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Add an endpoint for health checking
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  }
  // Special endpoint for the self-ping mechanism
  else if (req.url === '/self-ping') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      status: 'ok', 
      message: 'Self-ping received',
      timestamp: new Date().toISOString() 
    }));
  }
  // Default response
  else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Devil Minecraft Bot is running!\n');
  }
  
  logger.info(`Received keep-alive ping: ${req.url}`);
});

// Start the server on port 8080 (Replit's default HTTP port)
const PORT = process.env.PORT || 8080;

// Use 0.0.0.0 to bind to all network interfaces
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Keep-alive server running on port ${PORT}`);
});

module.exports = server;