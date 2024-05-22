// Import Discord.js components
const {
  GuildMember, // Class for member of a guild
  DiscordAPIError, // Class for any Discord API error
  PermissionFlagsBits, // Used for specifying permissions
  GuildChannelCreateOptions, // Used for JS Doc in 'createPrivate' function
  VoiceChannel, // Class for voice channel of a guild
  ChannelType, // Enum holding types of Discord channels
  Guild // Class for Discord Guild (Server)
} = require("discord.js");

// Import utility 'methods' file
const {
  sleep, // Asynchronously waits an amount of millseconds
  handleDiscordAPIError,
  getBotSettings
} = require("../utils/generalUtils.js");


const settings = getBotSettings() // Reading settings.yml file

const {
  maxPrivates, // Number which is maximum number of privates creatable in guild at single point
  emojis, // List of single character emojis used in names of privates
  privateDefaultName, // Default name assigned to a private when created
  privateCategoryId // Id of category for privates to be created under
} = settings.guild.privates;

const privates = {}; // Holds data for created privates
const queues = {}; // Holds queues of each create channel

function accessPrivates(func) {
  return func(privates);
}

/**
 * Creates a private in a guild.
 * @param {GuildMember} member - Member creating this private
 * @param {GuildChannelCreateOptions} options - Options for creating channel
*/
async function createPrivate(member, options) {
  const guild = member.guild;

  const privateChannel = await guild.channels.create({
    permissionOverwrites: [
      {
        id: member.id,
        allow: [PermissionFlagsBits.Connect]
      },
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.Connect]
      }],
    ...options,
    type: ChannelType.GuildVoice
  }
  );

  const newPrivateData = {
    creatorId: member.id,
    usersConnected: []
  }

  privates[guild.id] ??= {};
  privates[guild.id][privateChannel.id] = newPrivateData;

  console.log(`Created private for ${member.displayName}`);

  return privateChannel;
}

/**
 * Deletes a private in a guild.
 * @param {any} channel - Channel to check if private
*/
function isPrivate(channel) {
  if (channel instanceof VoiceChannel) {
    if (privates[channel.guild.id]?.[channel.id]) {
      return true;
    }
  }
  return false
}

/**
 * Returns an array of available emojis to use in privates for a guild
 * @param {Guild} guild - Guild to get available emojis for in
*/
function getAvailablePrivateEmojis(guild) {
  const availableEmojis = [...emojis];

  const privateChannels = privates[guild.id] ?? {};

  for (const channelId in privateChannels) {
    const channel = guild.channels.cache.get(channelId);

    if (channel) {
      const channelEmoji = String.fromCodePoint(channel.name.codePointAt(0));
      const index = availableEmojis.indexOf(channelEmoji);

      if (index !== -1) {
        availableEmojis.splice(index, 1);
      }
    }
  }
  return availableEmojis;
}

/**
 * Processes the queue in the voice channel to create privates.
 * @param {VoiceChannel} channel - Channel to process the queue of
*/
async function processQueue(channel) {
  const queue = queues[channel.id];

  if (queue && queue.length !== 0) {
    const guild = channel.guild;
    const activePrivates = privates[guild.id] ? Object.keys(privates[guild.id]).length : 0;

    if (maxPrivates === -1 || activePrivates < maxPrivates) {
      const member = guild.members.cache.get(queue[0]);

      const availableEmojis = getAvailablePrivateEmojis(guild);

      let emoji = ""

      if (availableEmojis.length !== 0) {
        emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
      }

      const createdPrivate = await createPrivate(
        member,
        { name: `${emoji} ${privateDefaultName}`, parent: privateCategoryId }
      );

      if (member.voice) {
        try {
          await member.voice.setChannel(createdPrivate);
        } catch (e) {
          if (!(e instanceof DiscordAPIError && (e.code === 40032 || e.code === 10003))) {
            handleDiscordAPIError(e);
          }
        }
      }

      await sleep(50);
      const privateChannel = guild.channels.cache.get(createdPrivate.id);

      if (privateChannel && !privateChannel.members.has(member.id)) {
        try {
          await privateChannel.delete("User left private after creating.");
          console.log(`Deleted private for ${member.displayName} as creator immediately left`);
        }
        catch (e) {
          if (!(e instanceof DiscordAPIError && e.code === 10003)) {
            handleDiscordAPIError(e);
          }
        }
      }
      return true;
    }
  }
  return false;
}

/**
 * Handles the create channel queue for privates.
 * @param {VoiceChannel} channel - Channel to handle queue for
*/
async function handleQueue(channel) {
  queues[channel.id] = [...channel.members.keys()];

  while (true) {
    const processed = await processQueue(channel);
    if (!processed) {
      await sleep(100);
    }
  }
}


async function onCreateJoin(newState) { // Executes when user joins voice channel to create a private
  const { member, channel } = newState;
  const queue = queues[channel.id];

  if (queue) {
    queue.push(member.id);
  } else {
    queues[channel.id] = [member.id];
  }
}

async function onCreateLeave(oldState) { // Executes when user joins voice channel to create a private
  const { member, channel } = oldState;
  const queue = queues[channel.id];

  if (queue) {
    const memberIndex = queue.indexOf(member.id) // Get index of member ID in array of users connected to private
    if (memberIndex !== -1) { // If member ID found; index found
      queue.splice(memberIndex, 1); // Remove member ID element at index
    }
  }
}

async function onPrivateLeave(oldState) {
  const { channel, member } = oldState; // Private voice channel they left

  if (channel.members.size === 0) { // If no members left in private
    try {
      await channel.delete("All users left the private.") // Delete channel
      console.log(`Deleted private for ${member.displayName} as all users left`) // Log action
    } catch (e) {
      if (!(e instanceof DiscordAPIError && e.code === 10003)) { // If not error trying to catch
        handleDiscordAPIError(e);
      }
    }
  } else {
    const channelData = privates[channel.guild.id]?.[channel.id]; // Attempt to get data of channel in guild

    if (channelData) { // If data of private channel exists
      const memberIndex = channelData.usersConnected.indexOf(member.id) // Get index of member ID in array of users connected to private

      if (memberIndex !== -1) { // If member ID found; index found
        channelData.usersConnected.splice(memberIndex, 1); // Remove member ID element at index
      }
    }
  }
}

async function onPrivateJoin(newState) {
  const { member, channel } = newState;
  const channelData = privates[channel.guild.id]?.[channel.id];

  if (channelData && !(member.id in channelData.usersConnected)) {
    channelData.usersConnected.push(member.id);
  }
}

function onPrivateDelete(channel) {
  delete privates[channel.guild.id]?.[channel.id];
}



module.exports = {
  createPrivate, // 'createPrivate' function
  isPrivate, // 'isPrivate' function
  onCreateJoin, // 'onCreateJoin' function
  onCreateLeave,
  onPrivateLeave, // 'onPrivateLeave' function
  onPrivateJoin, // 'onPrivateJoin' function
  onPrivateDelete,
  handleQueue,
  accessPrivates
}