// Import Discord.js components
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const {
  getVoiceConnection,
  AudioPlayerStatus
} = require('@discordjs/voice');

const { sendInteractionRejectMessage } = require("..//utils/generalUtils.js");

const {
  getQueue
} = require("../systems/musicSystem.js");

// Slash command configuration
const command = new SlashCommandBuilder()
  // Base command
  .setName('player')
  .setDescription('Manages the audio player of the bot')
  .addStringOption(option =>
    option
      .setName("action")
      .setDescription("Action of command")
      .setRequired(true)
      .addChoices(
        { name: "Skip", value: "Skip" },
        { name: "Queue", value: "Queue" },
        { name: "Pause", value: "Pause" },
        { name: "Resume", value: "Resume" }
      )
  )


// Slash command execution code
async function execute(interaction) {
  const { guild, member } = interaction; // Member executing the command

  const action = interaction.options.getString("action");

  const voiceChannel = member.voice.channel;

  const clientVoice = guild.members.me.voice;

  const voiceConnection = getVoiceConnection(guild.id);

  if (!voiceChannel || !clientVoice.channel || voiceChannel.id !== clientVoice.channel.id || !voiceConnection) {
    await sendInteractionRejectMessage(interaction, "Not in voice", "You must be in a voice channel with the bot.");
    return;
  }

  const player = voiceConnection.state.subscription.player;

  const queue = getQueue(guild.id);

  const videoInfo = queue[0]?.videoInfo;

  if (action === "Skip") {
    if (queue.length === 0) {
      await sendInteractionRejectMessage(interaction, "Nothing to skip", "There is nothing to skip.");
      return;
    }

    player.stop();

    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: "Skipped request" })
      .setDescription(videoInfo.title)

    await interaction.reply({ embeds: [replyEmbed] });
  }
  else if (action === "Queue") {
    let queueString = "";

    const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: "Queue" })

    if (queue.length === 0) {
      replyEmbed.setDescription("There are no entries in the queue.")
    }
    else {
      let number = 0;
      for (const { memberId, videoInfo } of queue) {
        number += 1;
        queueString += `**${number}** ${videoInfo.title}\n`;
      }
      replyEmbed.setDescription(queueString)
    }

    await interaction.reply({ embeds: [replyEmbed] });
  }
  else if (action === "Pause") {
    if (player.state.status === AudioPlayerStatus.Playing) {
      player.pause();

      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: "Player paused" })
        .setDescription("The audio player has been paused.");

      await interaction.reply({ embeds: [replyEmbed] });
    }
    else if (player.state.status === AudioPlayerStatus.Paused) {
      await sendInteractionRejectMessage(interaction, "Already paused", "The audio player is already paused.")
    }
    else {
      await sendInteractionRejectMessage(interaction, "No audio", "There is no audio to pause.")
    }
  }
  else if (action === "Resume") {
    if (player.state.status === AudioPlayerStatus.Paused) {
      player.unpause();

      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: "Player resumed" })
        .setDescription("The audio player has resumed.");

      await interaction.reply({ embeds: [replyEmbed] });
    }
    else if (player.state.status === AudioPlayerStatus.Playing) {
      await sendInteractionRejectMessage(interaction, "Not paused", "The audio player is not paused.")
    }
    else {
      await sendInteractionRejectMessage(interaction, "No audio", "There is no audio to pause.")
    }
  }
}

module.exports = {
  command: {
    data: command,
    execute
  }
}