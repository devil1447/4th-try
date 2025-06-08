# Devil - Minecraft AFK Bot

A 24/7 Minecraft AFK bot designed for PaperMC servers with plugin compatibility including "Villager in a Bucket."

## Features

- 🏃‍♂️ **Smart Anti-AFK System**: Avoids detection with random movements and actions
- 🔄 **Automatic Reconnection**: Handles disconnects with exponential backoff
- 🕒 **24/7 Operation**: Stays online using self-ping and optional external monitoring
- 💬 **In-Game Commands**: Control your bot with whispers and chat commands
- 📊 **Detailed Logging**: Track bot status and events
- 🔍 **Stuck Detection**: Identifies and escapes when the bot is trapped
- 🚀 **Plugin Compatible**: Works with various server plugins

## How It Works

Devil connects to your Minecraft server and performs random anti-AFK actions to avoid being kicked for inactivity. It runs on Replit, allowing for 24/7 operation without requiring a local computer.

## Setup Guide

1. Ensure your Minecraft server is running (version 1.21.5 recommended)
2. The bot is already configured to connect to DevilGod1447.aternos.me:64211
3. If you need to change server details, edit the `.env` file

## In-Game Commands

Control your bot by sending messages in-game:

- `!help` - Show available commands
- `!status` - Check bot status
- `!come` - Make the bot come to you
- `!jump` - Make the bot jump
- `!say <message>` - Make the bot say something
- `!look <direction>` - Change where the bot looks
- `!restart` - Restart anti-AFK system
- `!inventory` - Show bot's inventory

## 24/7 Operation

The bot uses multiple methods to stay online:

1. **Self-ping mechanism**: Automatically pings itself every 5 minutes
2. **External uptime services**: Optional setup instructions in `uptime.md`
3. **Error handling**: Automatic reconnection and recovery

For detailed uptime configuration, see `uptime.md`.

## Files Overview

- `index.js` - Entry point for the application
- `bot.js` - Main bot implementation
- `config.js` - Configuration settings
- `keep_alive.js` - HTTP server for uptime monitoring
- `self_ping.js` - Self-pinging mechanism
- `utils/antiAfk.js` - Anti-AFK implementation
- `utils/reconnect.js` - Reconnection logic
- `utils/logger.js` - Logging utility
- `commands/index.js` - Command handling

## Troubleshooting

If your bot goes offline:

1. Check if your Minecraft server is online
2. Verify the Replit project is running
3. Review logs for any errors
4. Restart the workflow if needed

Remember: Your Aternos server will still shut down when no players are online. The bot will automatically reconnect when it's back up.

## Credits

Created with:
- [Mineflayer](https://github.com/PrismarineJS/mineflayer)
- [node-cron](https://github.com/node-cron/node-cron)
- [winston](https://github.com/winstonjs/winston)

---

*No paid services required. Completely free to run on Replit.*