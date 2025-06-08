# Uptime Options for Your Devil Bot

## Using the Self-Ping Feature (Already Implemented)

Your bot now has a built-in self-ping mechanism that will help keep it running without any external services. This works by:

1. Creating an HTTP server that listens for requests
2. Setting up a scheduled task that pings this server every 5 minutes
3. Using this continuous activity to prevent Replit from putting your project to sleep

This is already active and working as you can see in the logs.

## External Uptime Monitoring Services (Optional)

For extra reliability, you can still use free uptime monitoring services. Here's how to set them up:

### Option 1: UptimeRobot

1. Go to [UptimeRobot](https://uptimerobot.com/) and create a free account
2. Add a new monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: Devil Bot
   - URL: `https://workspace.assistdevilgod1.repl.co` 
   - Monitoring Interval: Every 5 minutes

### Option 2: Cron-job.org

1. Go to [Cron-job.org](https://cron-job.org/en/) and create a free account
2. Add a new cronjob:
   - Title: Devil Bot
   - URL: `https://workspace.assistdevilgod1.repl.co`
   - Schedule: Every 5 minutes
   - Timeout: 30 seconds

### Option 3: FreshPing

1. Go to [FreshPing](https://www.freshworks.com/website-monitoring/) and create a free account
2. Add a new monitor with your URL

## Testing Your Uptime Configuration

To verify that your uptime solution is working:

1. Check the bot logs for messages like "Received keep-alive ping"
2. These messages should appear regularly (every 5 minutes for the self-ping)
3. You can also check your uptime service dashboard to see successful pings

## Troubleshooting

If you notice your bot going offline:

1. Check if the Replit project is still running
2. Visit your bot's URL directly in a browser to wake it up
3. Restart the bot workflow if needed

Remember that even with 24/7 uptime for your bot, your Minecraft server (Aternos) will still shut down when no players are online. The bot will automatically reconnect when the server becomes available again.