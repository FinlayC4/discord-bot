const { EmbedBuilder } = require("discord.js");

const { splitFileName, getBotSettings, enforceLength } = require("../utils/generalUtils.js");

const logsSettings = getBotSettings().guild.logs;

const maxFieldChars = 1024; // Maximum characters for a single embed field


module.exports = {
  formatAttachments(attachments, func) {
    const formattedAttachments = attachments.map((attachment) => { // Mapping the old message attachments into new values as new variable
      const [name, extension] = splitFileName(attachment.name); // Gets the name and the extension of a file name
      const fileName = `[${name}.${extension.toLowerCase()}](${attachment.url})`; // Formatting file name
      
      return func(attachment, fileName);
    });
    return formattedAttachments;
  },

  async sendMessageUpdateLog(oldMessage, newMessage) {
    const { member, guild, channel } = newMessage;

    const messageLogsChannel = guild.channels.cache.get(logsSettings.message.id); // Channel ID for posting any message-related logs
        
    // Constructing base embed
    const logEmbed = new EmbedBuilder() // Creating embed to post in channel
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() }) // Setting author name and icon for embed
      .setDescription(`Message **edited** in ${channel}`) // Description for embed

    // Message content change
    if (oldMessage.content != newMessage.content) { // If member edited the content of message
      const oldContent = enforceLength(oldMessage.content, maxFieldChars);
      const newContent = enforceLength(newMessage.content, maxFieldChars);

      logEmbed.addFields( // Adding fields to embed for the change in message content
        { name: "Before", value: oldContent, inline: true }, // Embed field for displaying old message content
        { name: "After", value: newContent, inline: true } // Embed field for displaying new message content
      );
    }

    // Change in attachments (one or more got removed)
    if (oldMessage.attachments.size != newMessage.attachments.size) { // If an attachment was removed
      const formattedAttachments = this.formatAttachments(oldMessage.attachments, (attachment, fileName) => {
        if (!newMessage.attachments.has(attachment.id)) { // If attachment was deleted; doesn't exist in new message attachments
          return "~~" + fileName + "~~"; // Return file name crossed out (display like that in Discord)
        } else {
          return fileName; // Just return the file name
        }
      });
      logEmbed.addFields({ name: "Files", value: formattedAttachments.join("\n") }) // Add Files field to log embed with attachmentLines as lines in string
    }

    await messageLogsChannel.send({ embeds: [logEmbed] }); // Send the log to the message logs channel
  },

  async sendMessageDeleteLog(message) {
    const { member, guild, channel } = message;

    const messageLogsChannel = guild.channels.cache.get(logsSettings.message.id); // Channel ID for posting any message-related logs

    let embedDescription = `Message **deleted** in ${channel}`; // Description for embed

    if (message.content !== "") {
      embedDescription = enforceLength(embedDescription + "\n" + message.content, maxFieldChars);
    }
    
    // Constructing base embed
    const logEmbed = new EmbedBuilder() // Creating embed to post in channel
      .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() }) // Setting author name and icon for embed
      .setDescription(embedDescription); // Description for embed

    // Logging any attachments in embed
    if (message.attachments.size !== 0) { // If attachments in message
      const attachmentLines = formatAttachments(message.attachments,
        (_a, fileName) => fileName);
        
      logEmbed.addFields({ name: "Files", value: attachmentLines.join("\n") }) // Add Files field to log embed with attachmentLines as lines in string
    }

    // Logging any stickers in embed
    if (message.stickers.size !== 0) { // If stickers in message
      const stickerLines = message.stickers.map((s) => `[${s.name}](${s.url})`) // Mapping the old message attachments into new values as new variable
      logEmbed.addFields({ name: "Stickers", value: stickerLines.join("\n") }) // Add Files field to log embed with attachmentLines as lines in string
    }

    messageLogsChannel.send({ embeds: [logEmbed] });
  }
}