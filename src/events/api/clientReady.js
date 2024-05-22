// Imports
const { Events } = require("discord.js") //requiring discord.js classes and enums

const { handleQueue } = require("../../systems/privateSystem.js");

const { checkExpiredBans } = require("../../systems/autoUnbanSystem.js");

//exporting file to be imported via index.js and loaded into bot

module.exports = { //code to be exported and therefore received by other files
  name: Events.ClientReady, //event to be used
  once: true, //determines whether event is only triggered once

  async execute(client) { //function which runs when it is triggered
    console.log(`Connected to Discord as ${client.user.displayName}.`); //notifies bot is connected to api

    const guild = client.guilds.cache.get("1127652502452580495");

    const createChannel = guild.channels.cache.get("1127654265360502834");

    setInterval(() => checkExpiredBans(client), 10000);
    handleQueue(createChannel);
  }
}

