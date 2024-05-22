const { Schema, model } = require("mongoose");

const warnSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  warnedAt: { type: Date, required: true },
  moderatorId: { type: String, required: true },
  warning: { type: String, required: true }
});

const Warn = model("Warn", warnSchema);

module.exports = Warn;