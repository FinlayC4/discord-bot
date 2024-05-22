// Import Discord.js components
const {
	SlashCommandBuilder,
	EmbedBuilder
} = require("discord.js");

const { getXp } = require("../systems/experienceSystem.js");


// Slash command configuration
const command = new SlashCommandBuilder()
	// Base command
	.setName('user')
	.setDescription('Get user information')
	// User option
	.addUserOption(option =>
		option
			.setName("user")
			.setDescription("User to get information for")
	);

function formatInfo(infoObj) {
	let infoString = "";

	for (const [key, value] of Object.entries(infoObj)) {
		infoString += key + ": " + value + "\n";
	}
	return infoString;
}

// Slash command execution code
async function execute(interaction) {
	const { guild, user, member } = interaction; // Member executing the command

	console.log(member.voice);

	console.log(member.voice.mute, member.voice.serverMute);

	// Retrieving options from interaction command
	const targetUser = interaction.options.getUser("user") ?? user; // User to ban; User or GuildMember. (required)

	const targetMember = guild.members.cache.get(targetUser.id);

	const userInfo = {
		"Name": targetUser.displayName,
		"Username": targetUser.username,
		"Created": "<t:" + Math.floor(targetUser.createdTimestamp / 1000) + ":d>"
	}

	const replyEmbed = new EmbedBuilder()
		.setAuthor({ name: targetUser.displayName, iconURL: targetUser.displayAvatarURL() })
		.setDescription(formatInfo(userInfo))
		.setColor(0x494b50);

	if (targetMember) {
		const { messageXp, voiceXp } = await getXp(targetUser.id, guild.id);
		const memberInfo = {
			"Name": targetMember.displayName,
			"Role": targetMember.roles.highest.name,
			"Joined": "<t:" + Math.floor(targetMember.joinedTimestamp / 1000) + ":d>",
			"Experience": messageXp + voiceXp
		}

		replyEmbed.addFields({ name: "Server", value: formatInfo(memberInfo) });
	}

	await interaction.reply({ embeds: [replyEmbed] });
}

module.exports = {
	command: {
		data: command,
		execute
	}
}