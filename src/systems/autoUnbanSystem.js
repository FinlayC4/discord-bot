// Imports
const { Client } = require("discord.js"); // Requiring DiscordAPIError class for error handling
const { handleDiscordAPIError } = require("../utils/generalUtils.js"); // Ban Mongoose model

const Ban = require("../mongo/models/Ban.js"); // Ban Mongoose model

/**
 * Checks and unbans any user whose ban has expired in the database
 * @param {Client} client - The client of the bot
 * @returns {Promise<void>}
 */
async function checkExpiredBans(client) {
  const expiredBans = await Ban.find({ unbannedAt: { $lte: new Date() } }); // Array of any expired bans in the database

  for (const ban of expiredBans) { // Iterate through each expired ban document
    const guild = client.guilds.cache.get(ban.guildId); // Get the guild where the ban was from

    if (guild) { // If guild exists
      try {
        const user = await guild.bans.remove(ban.userId, { reason: "Ban expired" }); // Remove the ban from guild
        console.log(`Removed ban for ${user.displayName} as ban expired`); // Log success message
      }
      catch (e) {
        handleDiscordAPIError(error, "Failed to unban user when ban expired.")
      }
    }
  }
}

module.exports = { checkExpiredBans };