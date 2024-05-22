const { Schema, model } = require("mongoose");

const muteSchema = new Schema({
  guildId: { type: String, required: true }, // ID of guild
  userId: { type: String, required: true }, // ID of user
  muteTypes: {
    type: Set,
    required: true,
    validate: {
      validator: (value) => value === "text" || value === "voice",
      message: "{VALUE} is not a valid mute type."
    }
  },
  mutedAt: { type: Date, required: true },
  unmutedAt: { type: Date },
  moderatorId: { type: String, required: true },
  reason: { type: String }
});

const Mute = model("Mute", muteSchema);

module.exports = Mute;