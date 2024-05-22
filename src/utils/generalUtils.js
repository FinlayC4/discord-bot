const {
  EmbedBuilder,
  User,
  Guild
} = require("discord.js");

const fs = require("node:fs"); // File system module
const yaml = require("js-yaml"); // For YAML parsing and stringifying
const path = require('node:path'); // Path utility module

const urlRegexSafe = require('url-regex-safe');

module.exports = {
  /**
   * Adds the functionality of a role superior check for an interaction.
   * @param {User} user - User to check if is superior of interaction executor
   * @param {Function} func - Function to be wrapped with added functionality
   * @returns 
   */
  withSuperiorRoleCheck(user, func) {
    return async (interaction, ...args) => {
      const { member, guild } = interaction;

      const memberToCheck = guild.members.cache.get(user.id);

      if (memberToCheck && member.roles.highest.position <= memberToCheck.roles.highest.position) {
        const errorEmbed = this.createErrorEmbed("Insufficient permission", "You do not have sufficient permission.");
        await interaction.reply({ embeds: [errorEmbed] });
      }
      else {
        return await func(interaction, ...args);
      }
    }
  },

  getBotSettings() {
    const settings = yaml.load(fs.readFileSync(
      path.resolve(__dirname, "../settings.yml"))
    ); // Reading settings.yml file and parsing yml
    return settings;
  },

  isConfiguredGuild(guild) {
    if (!(guild instanceof Guild)) {
      throw new TypeError("'guild' parameter must be a Guild object.");
    }
    const settings = yaml.load(fs.readFileSync(
      path.resolve(__dirname, "../settings.yml"))
    ); // Reading settings.yml file and parsing yml
    return guild.id === settings.guild.id;
  },

  /**
 * Checks whether a string contains ASCII printable characters only.
 * @param {String} string - String to check
 * @returns {Boolean} Boolean whether only ASCII printable characters
 */
  isAscii(string, printableOnly = false) {
    if (printableOnly) {
      return /^[\x21-\x7E]*$/.test(string);
    } else {
      return /^[\x00-\x7F]*$/.test(string);
    }
  },

  /**
   * Respond to an interaction with a reject embed message.
   */
  async sendInteractionRejectMessage(interaction, title, reason) {
    const embed = new EmbedBuilder()
			.setColor(0x783e3e) //0xeb3434
			//.setAuthor({ name: title })
			.setDescription(reason)
    
    await interaction.reply({ embeds: [embed], ephemeral: true })
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /** Splits a filename into name and extension */
  /** @param {String} fileName - Full name of file*/
  splitFileName(fileName) {
    if (typeof fileName !== "string") {
      throw new TypeError("The parameter 'fileName' must be a String.");
    }
    const index = fileName.lastIndexOf(".");

    if (index !== -1 && index !== fileName.length - 1) {
      const name = fileName.slice(0, index);
      const extension = fileName.slice(index + 1, fileName.length);

      return [name, extension];
    }
    else {
      throw new Error("File name does not contain an extension.");
    }
  },

  /** Shortens string to specified number of characters */
  /** @param {String} string - String to shorten */
  /** @param {Number} maxLength - A integer number for maximum length of string */
  enforceLength(string, maxLength) {
    if (typeof string !== "string") {
      throw new TypeError("'string' parameter must be a String.");
    }
    if (typeof maxLength !== "number" || !Number.isInteger(maxLength)) {
      throw new TypeError("'maxLength' parameter must be an integer number.");
    }

    if (string.length > maxLength) { // If string length is greater than max length specified
      return string.slice(0, maxLength - 3) + "..."; // Slice string down to 3 letters less than max lenth specified and append "..."
    }
    return string;
  },
  
 /**
 * Handles Discord API errors and logging.
 * @param {Error} error - Error which has been caught and is to be handled
 * @param {String} logMessage - Message to log if a DiscordAPIError occurs
 * @param {Boolean} throwOther - Whether to throw other errors
 * @returns {Boolean} Whether Discord API error occurred 
 */
  handleDiscordAPIError(error, logMessage = "", throwOther = true, ) {
    if (error instanceof DiscordAPIError) {
      console.log("[DiscordAPIError]", logMessage, "Error:", error.name, "Code:", error.code);
      return true;
    }
    else {
      if (throwOther) {
        throw error;
      }
      else {
        return false;
      }
    }
  },

  /** Gets all URLs contained within a string */
  /** @param {String} string - String to extract URLs from */
  extractURLs(string) {
    const matches = string.match(urlRegexSafe());
    return matches ? [...matches] : [];
  },

  hasAuthority(member1, member2) {
    return member1.roles.highest.position > member2.roles.highest.position;
  },

  /**
 * Reads a JSON file synchronously.
 * @param {String} fileName - File name or path 
 */
  jsonReadSync(fileName) {
    return JSON.parse(fs.readFileSync(fileName));
  },

  /**
 * Write to a JSON file synchronously.
 * @param {String} fileName - File name or path
 */
  jsonWriteSync(fileName, data) {
    fs.writeFileSync(fileName, JSON.stringify(data));
  },
}