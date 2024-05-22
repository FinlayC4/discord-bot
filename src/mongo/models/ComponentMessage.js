const { Schema, model } = require("mongoose");

const componentMessageSchema = new Schema({
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  data: { type: Object }
});

const ComponentMessage = model("ComponentMessage", componentMessageSchema);

module.exports = ComponentMessage;