const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { executeCommand } = require("./private.js");

const command = new ContextMenuCommandBuilder()
  .setName("Remove from Private")
  .setType(ApplicationCommandType.User);

async function execute(interaction) {
  await executeCommand(interaction, interaction.targetUser, "Remove")
}

module.exports = {
  command: {
    data: command,
    execute
  }
}