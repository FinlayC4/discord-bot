// Imports
const { Events, EmbedBuilder, GuildChannel } = require("discord.js");
const { getBotSettings, isConfiguredGuild } = require("../../utils/generalUtils.js");
const { sendMessageUpdateLog } = require("../../utils/logsUtils.js");
const { moderateMessage } = require("../../systems/automodSystem.js");

const settings = getBotSettings(); // Reading settings.yml file

module.exports = {
  name: Events.MessageUpdate, // Type of event
  once: false, // Is event only executed once

  async execute(oldMessage, newMessage) {
    // Executes when a message is updated in any text channel which the client has access to reading
    const { guild, member, author, channel, client } = newMessage; // Destructuring properties from newMessage for ease of use

    if ((guild && !isConfiguredGuild(guild)) || author.bot) return;

    if (channel instanceof GuildChannel && channel.isTextBased()) { // If channel event was fired in is a guild text based channel
      if (guild.id === settings.guild.id) { // If it is the guild same as set in the settings.yml file

        const [violated, deleted] = await moderateMessage(newMessage);

        await sendMessageUpdateLog(oldMessage, newMessage);
      }
    }
  }
}