// Imports

const { Events, GuildChannel } = require("discord.js"); // Importing discord.js components

const { isConfiguredGuild } = require("../../utils/generalUtils.js"); // Importing my utility functions

// Functions from files in 'systems' folder
const { moderateMessage } = require("../../systems/automodSystem.js");
const { createXpMessage } = require("../../systems/experienceSystem.js");

const xpPerMessage = 4; // XP per message. Needs migrating to settings.yml file


module.exports = {
  name: Events.MessageCreate, // Type of event
  once: false, // Is event only executed once

  async execute(message) {
    // Executes when a message is deleted in any text channel which the client has access to reading
    const { guild, member, author, channel } = message; // Destructuring properties from message for ease of use

    if ((guild && !isConfiguredGuild(guild)) || author.bot) return; // Terminate rest of code if guild same as set in settings.yml file or message created was by bot

    if (channel instanceof GuildChannel && channel.isTextBased()) { // If channel event was fired in is a guild text based channel
      const [violated, deleted] = await moderateMessage(message);

      if (!violated) {
        const messageCache = channel.messages.cache;

        if (!(messageCache.at(-2)?.member.id === member.id)) {
          await createXpMessage(message, xpPerMessage);
        }
      }
    }
  }
}