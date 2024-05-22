const { EmbedBuilder, VoiceState } = require("discord.js");

const {
  isPrivate,
  onCreateJoin,
  onCreateLeave,
  onPrivateLeave,
  onPrivateJoin
} = require("../../systems/privateSystem.js");

const { getBotSettings } = require("../../utils/generalUtils.js");

const { addVoiceMember, removeVoiceMember } = require("../../utils/voiceJoinTime.js");
const { getVoiceConnection } = require("@discordjs/voice");

const settings = getBotSettings();

const createChannelId = settings.guild.privates.createChannelId; // ID of voice channel which creates privates

const voiceLogsChannelId = settings.guild.logs.voice.id; // ID of channel to send voice logs to


/**
 * Run when a member joins or leaves a voice-based channel in a guild.
 * @param {VoiceState} oldState - Old voice state of member
 * @param {VoiceState} newState - New voice state of member
 * @returns {Promise<void>}
 */
async function onVoiceChannelUpdate(oldState, newState) {
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  const { guild, member } = newState;

  const clientMember = guild.members.me;

  let embedDescription;
  let switched = false;
  
  // Channel join
  if (newChannel !== null) { // If user has joined a voice channel
    addVoiceMember(member, newChannel);
  
    if (oldChannel !== null) {
      switched = true;
      embedDescription = `${member} **switched** from ${oldChannel.name} ➜ ${newChannel.name}`;
    } else {
      embedDescription = `${member} **joined** voice channel ${newChannel.name}`;
    }

    if (newChannel.id === createChannelId) { // If voice channel to create privates
      onCreateJoin(newState);
    }
    else if (isPrivate(newChannel)) { // Joined private
      onPrivateJoin(newState);
    }
  }

  // Channel leave
  if (oldChannel !== null) { // If user has left a voice channel
    removeVoiceMember(member, oldChannel);

    if (!switched) { // If not voice switch
      embedDescription = `${member} **left** voice channel ${oldChannel.name}`;
      
      if (member.id === clientMember.id) {
        const voiceConnection = getVoiceConnection(guild.id);

        if (voiceConnection) {
          voiceConnection.destroy();
        }
      }
    }

    if (oldChannel.members.has(clientMember.id)) {
      const realMembers = oldChannel.members.filter(m => !m.user.bot);

      if (realMembers.size === 0) {
        clientMember.voice.setChannel(null);
      }
    }

    if (oldChannel.id === createChannelId) { // If voice channel to create privates
      onCreateLeave(oldState);
    }
    else if (isPrivate(oldChannel)) { // Left private
      onPrivateLeave(oldState);
    }
  }

  const voiceLogsChannel = guild.channels.cache.get(voiceLogsChannelId);

  const logEmbed = new EmbedBuilder()
    .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
    .setDescription(embedDescription);

  voiceLogsChannel.send({ embeds: [logEmbed] });
}

module.exports = { onVoiceChannelUpdate };
