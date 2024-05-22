// Import Discord.js components
const {
  SlashCommandBuilder, // Class for creating slash commands
  EmbedBuilder, // Class for creating embeds
  DiscordAPIError, // Class for any Discord API error
  PermissionFlagsBits, // Used for specifying permissions
} = require("discord.js");

// Import utility 'methods' file
const {
  sendInteractionRejectMessage, // Generates error message embeds
  handleDiscordAPIError,
} = require("../utils/generalUtils.js");

const { isPrivate, accessPrivates } = require("../systems/privateSystem.js");


// Slash command configuration
const slashCommand = new SlashCommandBuilder()
  // Base command
  .setName('private')
  .setDescription('Manage a private')
  // User option
  .addStringOption(option =>
    option
      .setName("action")
      .setDescription("Action of command")
      .setRequired(true)
      .addChoices(
        { name: "Add", value: "Add" },
        { name: "Remove", value: "Remove" },
        { name: "Transfer", value: "Transfer" })
  )
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("User to perform action on")
      .setRequired(true)
  );


async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const action = interaction.options.getString("action");

  await executeCommand(interaction, user, action)
}

// Slash command execution code
async function executeCommand(interaction, user, action) {
  const member = interaction.member;
  const guild = member.guild; // Guild the command is being executed in

  if (!(member.voice.channel && isPrivate(member.voice.channel))) {
    await sendInteractionRejectMessage(interaction, "Not in private", "You are not in a 'private' voice channel."); // Construct error embed
    return; // Terminate rest of function code
  }

  const privateChannel = member.voice.channel; // Voice channel member executing command is in

  const channelData = accessPrivates((privates) => {
    return privates[privateChannel.guild.id]?.[privateChannel.id]; // Attempt to get channel data for private in guild
  })

  // If private channel data not exist OR users connected to channel is 0 OR private leader is not member executing commnad
  if ((!channelData || channelData.usersConnected.length === 0 || channelData.usersConnected[0] != member.id) && member.id !== guild.ownerId) {
    await sendInteractionRejectMessage(interaction, "Not leader", "You are not the leader of this private."); // Construct error embed
    return; // Terminate rest of function code
  }

  const userPermissions = privateChannel.permissionsFor(user); // Get permissions of user for private channel

  // Add a user
  if (action === "Add") { // If adding a user to a private
    if (userPermissions && userPermissions.has(PermissionFlagsBits.Connect)) { // If userPermissions exists and has 
      await sendInteractionRejectMessage(interaction, "User already added", "This user is already added to the private."); // Construct error embed
      return; // Terminate rest of function code
    }

    try {
      await privateChannel.permissionOverwrites.create(user, { Connect: true });
    }
    catch (e) {
      if (e instanceof DiscordAPIError && e.code === 10009) {
        await sendInteractionRejectMessage(interaction, "Unknown member", "This user is not apart of the server."); // Construct error embed
        return; // Terminate rest of function code
      }
      else {
        handleDiscordAPIError(e);
      }
    }

    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: "Added user", iconURL: user.displayAvatarURL() }) //
      .setDescription(`${user} added to ${privateChannel}`);

    await interaction.reply({ embeds: [replyEmbed] });
  }

  // Remove a user
  else if (action === "Remove") { // If removing a user from a private
    if (userPermissions && !userPermissions.has(PermissionFlagsBits.Connect)) {
      await sendInteractionRejectMessage(interaction, "Not added", "This user is not added to the private."); // Construct error embed
      return; // Terminate rest of function code
    }

    try {
      await privateChannel.permissionOverwrites.delete(user, `Removed from private by ${member.displayName}`);
    }
    catch (e) {
      if (e instanceof DiscordAPIError && e.code === 10009) {
        await sendInteractionRejectMessage(interaction, "Unknown member", "This user is not apart of the server."); // Construct error embed
      }
      else {
        handleDiscordAPIError(e);
      }
      return; // Terminate rest of function code
    }

    const targetMember = guild.members.cache.get(user.id); // Attempting to get fresh cache entry for 'user' in guild.members

    if (targetMember && targetMember.voice.channel) {
      if (targetMember.voice.channel === privateChannel) {
        try {
          await targetMember.voice.setChannel(null);
        } catch (e) {
          if (!(e instanceof DiscordAPIError && (e.code === 40032 || e.code === 10003))) {
            handleDiscordAPIError(e);
            return;
          }
        }
      }
    }

    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: "Removed user", iconURL: user.displayAvatarURL() })
      .setDescription(`${user} removed from ${privateChannel}`);

    await interaction.reply({ embeds: [replyEmbed] }); // Reply to interaction with embed
  }

  // Transfer private ownership
  else { // action === "Transfer"
    if (!privateChannel.members.has(user.id)) {
      await sendInteractionRejectMessage(interaction, "Not in private", "The user is not in your private."); // Construct error embed
      return; // Terminate rest of function code
    }

    const userIndex = channelData.usersConnected.indexOf(user.id);

    // Transfer failed
    if (userIndex === -1) { // If couldn't find the user ID in users connected
      await sendInteractionRejectMessage(interaction, "Transfer failed", "Couldn't transfer ownership to the user."); // Construct error embed
      return; // Terminate rest of function code
    }

    // Already leader
    if (userIndex === 0) { // If user ID is already at start of array (private leader)
      await sendInteractionRejectMessage(interaction, "User already leader", "This user is already the private leader."); // Construct error embed
      return; // Terminate rest of function code
    }

    // Making private leader

    accessPrivates((privates) => {
      const channelData = privates[guild.id]?.[privateChannel.id];
      if (channelData) {
        channelData.usersConnected.splice(userIndex, 1); // Remove the user ID from the array
        channelData.usersConnected.unshift(user.id); // Add it back at the start of array
      }
    })

    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: "Leader changed", iconURL: user.displayAvatarURL() }) // Set author name and icon of embed
      .setDescription(`${user} is now the private leader.`); // Set embed description

    await interaction.reply({ embeds: [replyEmbed] }); // Reply to interaction with embed
  }
}


module.exports = {
  command: {
    data: slashCommand, // Slash command structure to be posted to API
    execute // Code to run when slash command executed
  },
  executeCommand
}