const { Guild, Message } = require("discord.js"); // Requiring necessary discord components

const Experience = require("../mongo/models/Experience.js"); // Experience Mongoose model

/** Ensures parsed message argument is a Message
 * object in a guild, otherwise, errors. */
function validateMessage(message) {
  if (!(message instanceof Message && message.inGuild())) {
    throw new TypeError("'message' parameter must be a Message object from a guild.");
  }
}

/**
 * Gets a user's XP in a guild.
 * @param {String} userId - ID of user to get xp for
 * @param {String} guildId - ID of guild to get xp from
 * @returns {Promise<object>}
*/
async function getXp(userId, guildId) {
  const xpObj = { messageXp: 0, voiceXp: 0 };

  const xpDocument = await Experience.findOne({ userId, guildId });

  if (xpDocument) {
    for (const messageData of xpDocument.xpMessages.values()) {
      xpObj.messageXp += messageData.xp;
    }
    xpObj.voiceXp = xpDocument.voiceXp;
  }
  return xpObj;
}

/**
 * Creates an XP message for a user in a guild.
 * @param {Message} message - Message in guild
 * @param {Number} xp - Amount of xp for this message
 * @returns {Promise<void>}
 */
async function createXpMessage(message, xp) {
  validateMessage(message);

  const xpMessageUpdates = {
    xp: xp,
    channelId: message.channel.id,
    contentLength: message.content.length
  };
  const filter = {
    userId: message.author.id,
    guildId: message.guild.id
  };
  const update = {
    $set: { [`xpMessages.${message.id}`]: xpMessageUpdates }
  };

  await Experience.updateOne(filter, update, { upsert: true });
}

/**
 * Deletes an XP message in a guild.
 * @param {Message} message - Message in guild
 * @returns {Promise<Boolean>} Whether the XP message actually existed and was deleted.
 */
async function deleteXpMessage(message) {
  validateMessage(message);

  const filter = {
    userId: message.author.id,
    guildId: message.guild.id
  };
  const update = { $unset: { [`xpMessages.${message.id}`]: 1 } };

  const xpDocument = await Experience.findOneAndUpdate(filter, update);

  return !!xpDocument;
}

/**
 * This function hands experience out to members in guild voice who satisfy internal conditions.
 * @param {Guild} guild - The guild to give xp to voice users in
 * @param {Number} amount - Amount of xp to give
 * @returns {Promise<void>}
 */
async function handVoiceXp(guild, amount) {
  const voiceBasedChannels = guild.channels.cache.filter(c => c.isVoiceBased());

  for (const [id, channel] of voiceBasedChannels) {
    const validMembers = channel.members.filter((m) => {
      return m.voice.mute === false && m.voice.deaf === false;
    });

    if (validMembers.size > 1) {
      validMembers.forEach(async (m) => {
        // Give xp to member
      });
    }
  }
}


module.exports = {
  getXp,
  handVoiceXp,
  createXpMessage,
  deleteXpMessage
};
