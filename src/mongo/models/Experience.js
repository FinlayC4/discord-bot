const { Schema, model } = require("mongoose");

const numberValidate = {
  validator: value => Number.isInteger(value) && value >= 0,
  message: "{VALUE} is not a non-negative integer value."
}

const experienceSchema = new Schema({
  // ID of guild
  guildId: {
    type: String,
    required: true
  },
  // ID of user
  userId: {
    type: String,
    required: true
  },
  // Map of XP messages
  xpMessages: {
    type: Map,
    of: {
      // XP gained from this message
      xp: {
        type: Number,
        validate: numberValidate
      },
      // ID of channel message was sent in
      channelId: {
        type: String,
      },
      // Length of message content
      contentLength: {
        type: Number,
        validate: numberValidate
      }
    },
    default: new Map(),
  },
  // XP gained from voice
  voiceXp: {
    type: Number,
    default: 0,
    validate: numberValidate
  },
  // Whether gaining xp is disabled
  xpDisabled: {
    type: Boolean,
    default: false
  }
});

const Experience = model("Experience", experienceSchema);

module.exports = Experience;