const { connect, connection } = require("mongoose"); // Library for interacting with MongoDB
const config = require('../config.json'); // Getting config information

const uri = config.mongo.uri; // URI for connecting to database

async function connectDb(db) {
  await connect(uri, { dbName: db })
}

connection.on("connected", () => {
  console.log("Connected to MongoDB database.");
});

connection.on("disconnected", () => {
  console.log("Disconnected from MongoDB database.")
})

module.exports = { connectDb };