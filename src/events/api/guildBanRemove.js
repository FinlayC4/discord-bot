//module imports
const { Events } = require("discord.js") //requiring discord.js classes and enums

const Ban = require("../../mongo/models/Ban.js");

//exporting file to be imported via index.js and loaded into bot

module.exports = { // Code to be exported and therefore received by other files
  name: Events.GuildBanRemove, // Event to be used
  once: false, // Determines whether event is only triggered once

  async execute(ban) { // Function which runs when it is triggered
    const { guild, user } = ban;
    
    const document = await Ban.findOneAndDelete({ userId: user.id, guildId: guild.id });
    
    if (document) {
      console.log(`Removed ban data for ${user.displayName} from database.`);
    }
  }
}
