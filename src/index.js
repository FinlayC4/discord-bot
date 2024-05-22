// Imports
const { REST, Routes, Client, Collection, GatewayIntentBits } = require('discord.js');

const { connectDb } = require("./mongo/database.js");
const { getBotSettings } = require('./utils/generalUtils.js');

const fs = require('node:fs'); // For reading files
const path = require('node:path'); // For constructing file paths

const config = require('./config.json'); // Getting config information

const settings = getBotSettings();

const { token, clientId } = config.discord; // Credentials for Discord bot

const client = new Client({ // Instantiating client for bot
	intents: [ // Intents enabled
		GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates
	]
});

const rest = new REST().setToken(token); // Create REST instance and set token for authentication

client.commands = new Collection(); // Setting 'commands' client attribute to a new instance of 'Collection'

// Commands folder and files
const commandsFolder = path.join(__dirname, 'commands'); //merging working directory path with 'commands' folder name
const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js')); //get array of files in commands folder that name ends with .js

// Events folder and files
const eventsFolder = path.join(__dirname, 'events/api'); //merging working directory path with 'events' folder name
const eventFiles = fs.readdirSync(eventsFolder).filter(file => file.endsWith('.js')); //get array of files in events folder that name ends with .js

const commands = []; // Declare commands array variable for appending command entries into

// Slash command file handler
for (const file of commandFiles) { // For each .js file in 'commands' folder
	const filePath = path.join(commandsFolder, file); // Nerge commands folder path with file name
	const { command } = require(filePath); // Get module exports of file which is the command

	commands.push(command.data.toJSON()); // Convert command object to JSON string and add to commands array for rest putting
	client.commands.set(command.data.name, command) // Add command object to client's array 'commands' property for accessing
}

// Event handler
for (const file of eventFiles) { // For each event file
	const filePath = path.join(eventsFolder, file); // Join events folder path with file name
	const event = require(filePath); // Get module exports of file which is event

	if (event.once) { // If event set to only be triggered once
		client.once(event.name, (...args) => event.execute(...args)); // Register once-only event
	} else { // If not once only event
		client.on(event.name, (...args) => event.execute(...args)); // Register event
	}
}

async function start() {
	// Starts the bot
	await connectDb("DuckBot");
	await rest.put( //rest put
		Routes.applicationGuildCommands(clientId, settings.guild.id), // Constructs URL path
		{ body: commands }, // Options
	);
	await client.login(token); // Authenticating bot with Discord API
}

start(); // Start the bot