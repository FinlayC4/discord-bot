const { Events } = require("discord.js")

const { isConfiguredGuild } = require("../../utils/generalUtils.js");
const { onVoiceChannelUpdate } = require("../custom/voiceChannelUpdate.js");


module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,

  async execute(oldState, newState) {
    const guild = newState.guild;

    if (!isConfiguredGuild(guild)) return;

    // Voice channel change
    if (oldState.channel !== newState.channel) { // If voice channel left or joined
      onVoiceChannelUpdate(oldState, newState);
    }
    if (oldState.deafen !== newState.deafen) {
      // Deafened
      if (newState.deafen === true) {
        
      }
      // Undeafened
      else {

      }
    }
  }
}


