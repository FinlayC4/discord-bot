const { Events, EmbedBuilder, DiscordAPIError } = require("discord.js");

const { handleDiscordAPIError, isConfiguredGuild, getBotSettings } = require("../../utils/generalUtils");

const settings = getBotSettings();

const messageLogsChannelId = settings.guild.logs.message.id; // Channel ID for message-related logs

module.exports = {
  name: Events.GuildMemberRemove, // Type of event
  once: false, // Is event only executed once

  async execute(member) {
    // Executes when a message is deleted in any text channel which the client has access to reading
    const guild = member.guild; // Destructuring properties from message for ease of use

    if (!isConfiguredGuild(guild)) return; // If not same guild as set in the settings.yml file, terminate rest of code

    const messageLogsChannel = guild.channels.cache.get(messageLogsChannelId); // Attempt to get message logs channel in guild with ID

    const logEmbed = new EmbedBuilder() // Creating embed to post in channel
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() }) // Setting author name and icon for embed
      .setDescription(`${member} **left** the server`); // Description for embed

    messageLogsChannel.send({ embeds: [logEmbed] })
      .catch((e) => handleDiscordAPIError(e)); // Sending message attached with embed in channel
  }
}