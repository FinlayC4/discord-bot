const { Events, EmbedBuilder, GuildChannel } = require("discord.js");

const { getBotSettings, isConfiguredGuild } = require("../../utils/generalUtils.js");
const { sendMessageDeleteLog } = require("../../utils/logsUtils.js");

const { deleteXpMessage } = require("../../systems/experienceSystem.js");

const settings = getBotSettings();

module.exports = {
  name: Events.MessageDelete, // Type of event
  once: false, // Is event only executed once

  async execute(message) {
    const { guild, member, author, channel } = message; // Destructuring properties from message for ease of use

    if ((guild && !isConfiguredGuild(guild)) || author.bot) return;

    if (channel instanceof GuildChannel && channel.isTextBased()) { // If channel event was fired in is a guild text based channel
      if (guild.id === settings.guild.id) { // If it is the guild same as set in the settings.yml file

        deleteXpMessage(message);
        sendMessageDeleteLog(message);
      }
    }
  }
}