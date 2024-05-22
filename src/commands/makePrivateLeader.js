const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
const { executeCommand } = require("./private.js");

const command = new ContextMenuCommandBuilder()
  .setName("Make private leader")
  .setType(ApplicationCommandType.User);

async function execute(interaction) {
  await executeCommand(interaction, interaction.targetUser, "Transfer");
}

module.exports = {
  command: {
    data: command,
    execute
  }
}