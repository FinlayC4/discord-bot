//module imports
const { Events, ChannelType } = require("discord.js") //requiring discord.js classes and enums
const { isPrivate, onPrivateDelete } = require("../../systems/privateSystem.js");

//exporting file to be imported via index.js and loaded into bot

module.exports = { //code to be exported and therefore received by other files
  name: Events.ChannelDelete, //event to be used
  once: false, //determines whether event is only triggered once

  async execute(channel) { //function which runs when it is triggered
    if (isPrivate(channel)) {
      onPrivateDelete(channel);
    }
  }
}

