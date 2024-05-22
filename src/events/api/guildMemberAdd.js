// Imports

const { Events, EmbedBuilder } = require("discord.js");

const {
  isConfiguredGuild,
  getBotSettings,
  handleDiscordAPIError
} = require("../../utils/generalUtils.js");

// Constant variables

const settings = getBotSettings();

const messageLogsChannelId = settings.guild.logs.message.id; // Channel ID for message-related logs

const joinRoleIds = ["1127660413836853268"]; // IDs of roles to given when any member joins


async function assignJoinRoles(member) {
  for (const roleId of joinRoleIds) {
    const joinRole = member.guild.roles.cache.get(roleId);

    if (joinRole) {
      try {
        await member.roles.add(joinRole);
      }
      catch (error) {
        handleDiscordAPIError(error, `Failed to add role with ID ${roleId} to ${member.displayName} when joining the server.`);
      }
    } else {
      console.error(`Join role with ID ${roleId} is undefined and therefore could not be given to ${member.displayName}.`)
    }
  }
}

module.exports = {
  name: Events.GuildMemberAdd, // Type of event
  once: false, // Is event only executed once

  /* Executes when a message is deleted in any text
  channel which the client has access to reading */
  async execute(member) {
    const guild = member.guild; // Destructuring properties from message for ease of use

    if (!isConfiguredGuild(guild)) return; // If not same guild as set in the settings.yml file

    const messageLogsChannel = guild.channels.cache.get(messageLogsChannelId); // Attempt to get message logs channel in guild with ID

    assignJoinRoles(member);

    if (messageLogsChannel) {
      const logEmbed = new EmbedBuilder() // Creating embed to post in channel
        .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() }) // Setting author name and icon for embed
        .setDescription(`${member} **joined** the server`); // Description for embed

      messageLogsChannel.send({ embeds: [logEmbed] }); // Sending message attached with embed in channel
    }
  }
}