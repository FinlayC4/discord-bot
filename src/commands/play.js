// Import Discord.js components
const {
	SlashCommandBuilder,
	EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

const fs = require('fs/promises'); // For file system operations

const {
  createAudioPlayer,
  getVoiceConnection,
  AudioPlayerStatus
} = require('@discordjs/voice');

const { sendInteractionRejectMessage } = require("../utils/generalUtils.js");

const {
  addToQueue,
  removeFromQueue,
  getQueue,
  createVoiceConnectionWithPlayer,
  processQueue
} = require("../systems/musicSystem.js");

const { search } = require("play-dl")

// Slash command configuration
const command = new SlashCommandBuilder()
	// Base command
	.setName('play')
	.setDescription('Plays audio in a voice channel')
  .addStringOption(option =>
		option
			.setName("query")
			.setDescription("Query to find the requested audio")
      .setRequired(true)
	);


// Slash command execution code
async function execute(interaction) {
	const { guild, member } = interaction; // Member executing the command

  const query = interaction.options.getString("query");

  const voiceChannel = member.voice.channel;
  const clientVoice = guild.members.me.voice;

  if (!voiceChannel) {
    await sendInteractionRejectMessage(interaction, "Not in voice", "You must be in a voice channel.");
    return;
  }

  const searchResults = await search(query, { limit: 1 });

  if (searchResults.length === 0) {
    await sendInteractionRejectMessage(interaction, "No result found", "No result was found with the given query.");
    return;
  }

  const videoInfo = searchResults[0];

  let voiceConnection = getVoiceConnection(guild.id);
  
  if (!voiceConnection) {
    voiceConnection = createVoiceConnectionWithPlayer(voiceChannel);
  }
  else {
    if (clientVoice.channel) {
      if (voiceChannel.id !== clientVoice.channel.id) {
        const player = voiceConnection.state.subscription.player;

        if (player.state.status === AudioPlayerStatus.Idle) {
          clientVoice.setChannel(voiceChannel);
        }
        else {
          await sendInteractionRejectMessage(interaction, "Music in use", "The bot is currently being used elsewhere.");
          return;
        }
      }
    }
  }

  const player = voiceConnection.state.subscription.player;

  addToQueue(member, videoInfo);

  const queue = getQueue(guild.id);

  const replyEmbed = new EmbedBuilder()
    .setDescription(videoInfo.title)
    .addFields({ name: "Duration", value: videoInfo.durationRaw })
    .setColor(0x50535C);

  
  if (queue.length > 1) {
    replyEmbed.setAuthor({ name: "Added to queue" })
  }
  else {
    await processQueue(guild.id, player);

    replyEmbed.setAuthor({ name: "Now playing", iconURL: videoInfo.thumbnails[0].url })
  }

  await interaction.reply({ embeds: [replyEmbed] });
}

module.exports = {
	command: {
		data: command,
		execute
	}
}