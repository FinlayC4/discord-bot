// Import Discord.js components
const {
	SlashCommandBuilder,
	EmbedBuilder,
	DiscordAPIError,
	PermissionFlagsBits
} = require("discord.js");

// Import utility 'methods' file
const {
	sendInteractionRejectMessage,
	handleDiscordAPIError, // Generates error message embeds
} = require("../utils/generalUtils.js");


// Slash command configuration
const command = new SlashCommandBuilder()
	// Base command
	.setName('unban')
	.setDescription('Unban a user')
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	// User option
	.addUserOption(option =>
		option
			.setName("user")
			.setDescription("The user to unban")
			.setRequired(true)
	)
	// Reason option
	.addStringOption(option =>
		option
			.setName("reason")
			.setDescription("Reason for unban")
	);


// Slash command execution code
async function execute(interaction) {
	const { guild, member } = interaction;

	// Retrieving options from interaction command
	const user = interaction.options.getUser("user"); // User to ban; User or GuildMember. (required)
	const reason = interaction.options.getString("reason"); // Reason of ban; String or null

	try {
		await guild.bans.remove(user, reason); // Unban user from guild
	}
	catch (e) {
		if (e instanceof DiscordAPIError && e.code === 10026) { // If DiscordAPIError and code for 'Unknown Ban' (no ban exists)
			await sendInteractionRejectMessage(interaction, "User not banned", "This user is not banned."); // Construct error embed
		}
		else {
			handleDiscordAPIError(e);
		}
		return; // Terminate rest of function code
	}

	const replyEmbed = new EmbedBuilder() // Create embed to modify for posting
		.setAuthor({ name: "Unbanned user", iconURL: user.displayAvatarURL() }) // Set heading and icon for embed
		.setDescription(`${user} has been **unbanned**.`); // Set embed description

	await interaction.reply({ embeds: [replyEmbed] }); // Reply to command interaction with embed
}

module.exports = {
	command: {
		data: command,
		execute
	}
};