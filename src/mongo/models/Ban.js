const { Schema, model } = require("mongoose");

const banSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  bannedAt: { type: Date, required: true },
  unbannedAt: Date,
  moderatorId: { type: String, required: true },
  reason: String
});

const Ban = model("Ban", banSchema);

module.exports = Ban;