/**
 * Devil - Minecraft AFK Bot
 * PM2 ecosystem configuration
 */

module.exports = {
  apps: [{
    name: 'devil-minecraft-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 10000, // 10 seconds delay between restarts
    max_restarts: 10, // Maximum number of restarts within a time frame
    error_file: './logs/pm2_error.log',
    out_file: './logs/pm2_output.log',
    merge_logs: true,
    exp_backoff_restart_delay: 100 // Exponential backoff on restart
  }]
};
