/**
 * Script to display the Replit URL for the project
 */

console.log("Your bot URL should be accessible at:");
console.log(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
console.log("\nOr if you've forked or renamed the project, it might be accessible at:");
console.log("https://your-project-name.your-username.repl.co");
console.log("\nIf you're on a team repl, it might be:");
console.log("https://your-project-name.team-name.repl.co");

console.log("\nYou can use any of the above URLs that work with your uptime service.");
console.log("After setting up the uptime service, verify it's working by checking the logs for 'Received keep-alive ping' messages.");