const { Attachment, EmbedBuilder, Message, PermissionFlagsBits } = require("discord.js"); // Importing required discord components

const {
  splitFileName,
  extractURLs,
  handleDiscordAPIError,
  getBotSettings,
  isAscii,
  sendInteractionRejectMessage
} = require("../utils/generalUtils.js"); // General custom utility functions

const fs = require("node:fs");

const { getDomain } = require("tldts"); // Used for getting parts of a URL

const automodSettings = getBotSettings().guild.automod;

// Array of allowed or disallowed extensions (depends on settings.yml)
const allowedExtensions = fs.readFileSync("src/data/extensions.txt", "utf-8")
  .split(/\r?\n/).map((e) => e.toLowerCase());

// Array of allowed or disallowed domains (depends on settings.yml)
const allowedDomains = fs.readFileSync("src/data/domains.txt", "utf-8")
  .split(/\r?\n/).map((e) => e.toLowerCase());


/**
 * Checks whether an attachment is a banned file format.
 * @param {Attachment} attachment - Attachment to check for
 * @returns {Boolean} Boolean whether attachment is a banned format
 */
function isBannedFormat(attachment) {
  const [name, extension] = splitFileName(attachment.name); // Get name and extension of file name
  return !allowedExtensions.includes(extension);
}

/**
 * Gets banned URLs in a string.
 * @param {String} url - String to scan for
 * @returns {Boolean} Boolean whether URL is banned
 */
function isBannedURL(url) {
  const domain = getDomain(url); // Get domain of url
  return domain === null || !allowedDomains.includes(domain) // Returns whether domain is in allowedDomains array
}

async function deleteMessage(message, errorMessage) {
  try {
    await message.delete(); // Delete message
    return true;
  }
  catch (error) {
    // If DiscordAPIError, handle it and log, otherwise, throw
    handleDiscordAPIError(error, errorMessage);
    return false;
  }
}

/**
 * Moderates a message and deletes it if necessary.
 * @param {Message} message - Message to moderate
 * @param {Object} options - Options for function
 * @returns {Promise<Array<boolean>>}  Array with two booleans: whether the message violated and whether was deleted
 */
async function moderateMessage(message, options = {}) {
  const { member, channel, guild } = message; // Destructuring properties from message object
  const { inform = true, remove = true } = options;

  let errorEmbed; // Declaring variable for sufficient scope access and initialisation
  let violated = false; // Whether automod detected any violation against message checks

  if (message.deletable) { // If message is deletable

    // File format moderation
    if (message.attachments.some((a) => isBannedFormat(a))) { // If message attachments contains one with a prohibited file extension
      violated = true; // Message has violated the automod

      const deleted = await deleteMessage(message, `Failed to delete message for ${member.displayName} containing forbidden file format.`); // Delete message safely
      
      /*if (deleted) {
        errorEmbed = createErrorEmbed("Prohibited file format", "This file format is not permitted."); // Create embed to possibly post
        console.log(`Deleted message for ${member.displayName} as contained forbidden file format.`); // Log message deletion
      }*/
    }
    // URL moderation
    else if (extractURLs(message.content).some((u) => isBannedURL(u))) { // If a banned URL exists in URLs in message content
      violated = true; // Message has violated the automod

      const deleted = await deleteMessage(message, `Failed to delete message for ${member.displayName} containing forbidden URL.`) // Delete message safely

      /*if (deleted) {
        errorEmbed = createErrorEmbed("Forbidden URL", "Message contains a forbidden URL."); // Create embed to possibly post
        console.log(`Deleted message for ${member.displayName} as contained forbidden URL.`); // Log message deletion
      }*/
    }
  }

  // Notifying automod intervention to user

  if (errorEmbed && inform) { // If message was deleted by automod and informUser is true
    const botPermissions = channel.permissionsFor(guild.members.me); // Get permissions for bot in channel
    if (botPermissions.has(PermissionFlagsBits.SendMessages)) { // If bot has permission to send messages
      try {
        await channel.send({ embeds: [errorEmbed] }); // Try to send message in channel
      }
      catch (error) { // If error occurred
        // If DiscordAPIError, handle it and log, otherwise, throw
        handleDiscordAPIError(error, `Failed to send automod message to ${member.displayName}`);
      }
    }
  }
  // Returns whether violated automod and if message was deleted
  return [violated, errorEmbed ? true : false]
}

module.exports = { moderateMessage };