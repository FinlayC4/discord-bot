// Import Discord.js components
const {
	SlashCommandBuilder,
	EmbedBuilder,
	ChannelType,
	PermissionFlagsBits
} = require("discord.js");

const { sendInteractionRejectMessage, handleDiscordAPIError } = require("../utils/generalUtils.js");
const { parseDuration } = require("../utils/parseDuration.js");

const maxSlowmodeSeconds = 21600 // Maximum slowmode cooldown in seconds. 6 hours. Limited by API

// Slash command configuration
const command = new SlashCommandBuilder()
	// Base command
	.setName('slowmode')
	.setDescription('Set the slowmode')
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
	// User option
	.addChannelOption(option =>
		option
			.setName("channel")
			.setDescription("Channel to set slowmode for")
			.addChannelTypes(ChannelType.GuildText)
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName("cooldown")
			.setDescription("Slowmode cooldown time")
			.setRequired(true)
	);


// Slash command execution code
async function execute(interaction) {
	const { guild, member } = interaction; // Member executing the command

	const targetChannel = interaction.options.getChannel("channel");
	const cooldownString = interaction.options.getString("cooldown");

	const [error, seconds] = parseDuration(cooldownString, 0, maxSlowmodeSeconds);

	if (error) { // If error occurred when parsing duration string
		await sendInteractionRejectMessage(interaction, "Invalid usage", error); // Construct error embed
		return; // Terminate rest of function code
	}

	if (targetChannel.rateLimitPerUser === seconds) {
		await sendInteractionRejectMessage(interaction, "Value already set", "The channel is already set with this value."); // Construct error embed
		return; // Terminate rest of function code
	}

	try {
		await targetChannel.setRateLimitPerUser(seconds, `${member.displayName} set the slowmode.`);
	} catch (error) {
		handleDiscordAPIError(error);
		return;
	}

	const replyEmbed = new EmbedBuilder()
		.setAuthor({ name: "Slowmode set", iconURL: guild.iconURL() })

	if (seconds === 0) {
		replyEmbed.setDescription(`Disabled slowmode in ${targetChannel}.`)
	} else {
		replyEmbed.setDescription(`Set slowmode in ${targetChannel} to ${seconds}.`)
	}

	await interaction.reply({ embeds: [replyEmbed] });
}

module.exports = {
	command: {
		data: command,
		execute
	}
}