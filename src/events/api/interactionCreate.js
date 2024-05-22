const { Events } = require("discord.js")
const { createErrorEmbed } = require("../../utils/generalUtils.js");

const ComponentMessage = require("../../mongo/models/ComponentMessage.js");

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction) {
    const { member, message, customId } = interaction;

    // Slash command
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      
      await command.execute(interaction);
    }
    // Button interaction
    else if (interaction.isButton()) {

      if (customId === "sessionYes" || customId === "sessionNo") {
        let update;

        if (customId === "sessionYes") {
          update = { $addToSet: { "data.attendees": member.id } };
        } else { // customId === "sessionNo"
          update = { $pull: { "data.attendees": member.id } };
        }

        const updatedDoc = await ComponentMessage.findOneAndUpdate(
          { messageId: message.id }, update, { new: true });

        if (updatedDoc) {
          const attendeesNumber = updatedDoc.data.attendees.length;
          const sessionEmbed = { ...message.embeds[0].data };

          const requiredValue = sessionEmbed.fields[0].value; 

          sessionEmbed.fields[0].value = attendeesNumber + "/" + requiredValue.split("/")[1];
          
          interaction.update({ embeds: [sessionEmbed] });
        }
        else {
          const errorEmbed = createErrorEmbed("Error processing vote", "Something went wrong attempting to process your vote.");
          interaction.reply({ embeds: [errorEmbed], ephemeral: true })
        }
      }
    }
  }
}