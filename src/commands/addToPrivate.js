const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { executeCommand } = require("./private.js");

const command = new ContextMenuCommandBuilder()
  .setName("Add to Private")
  .setType(ApplicationCommandType.User);

async function execute(interaction) {
  await executeCommand(interaction, interaction.targetUser, "Add")
}

module.exports = {
  command: {
    data: command,
    execute
  }
}