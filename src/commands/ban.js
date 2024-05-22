// Import Discord.js components
const {
	SlashCommandBuilder,
	EmbedBuilder,
	GuildMember,
	UserResolvable,
	DiscordAPIError,
	PermissionFlagsBits
} = require("discord.js");

// Import utility 'methods' file
const {
	sendInteractionRejectMessage,
	withSuperiorRoleCheck,
	handleDiscordAPIError, // Compares two users' authority
	getBotSettings
} = require("../utils/generalUtils.js");

const { parseDuration } = require("../utils/parseDuration.js");

const Ban = require("../mongo/models/Ban.js");

const settings = getBotSettings();

const maxBanDuration  = settings.guild.ban.maxDuration;
const logsChannelId = settings.guild.logs.admin.id;

// Slash command configuration
const command = new SlashCommandBuilder()
	// Base command
	.setName('ban')
	.setDescription('Ban a user')
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	// User option
	.addUserOption(option =>
		option
			.setName("user")
			.setDescription("The user to ban")
			.setRequired(true)
	)
	// Delete messages option
	/*.addIntegerOption(option =>
		option
			.setName("delete_messages")
			.setDescription("How much of their recent history to delete")
			.setRequired(true)
			.setChoices(
				{ name: "Don't Delete Any", value: 0 },
				{ name: "Previous 24 Hours", value: 1 },
				{ name: "Previous 24 Days", value: 24 }
			))*/
	// Duration option
	.addStringOption(option =>
		option
			.setName("duration")
			.setDescription("Duration of ban")
	)
	// Reason option
	.addStringOption(option =>
		option
			.setName("reason")
			.setDescription("Reason for ban")
	);

/**
 * Extends the default ban implementation of Discord's API with abilities to temporarily ban for a set period of time.
 * @param {UserResolvable} user - User to ban from guild
 * @param {GuildMember} executor - Member executing this ban
 * @param {Object} [options] - Optional options for ban
*/
async function ban(user, executor, options = {}) {
	const { seconds = 0, reason, log = true } = options; // Object destructuring for parameter variable 'options'
	const guild = executor.guild;

	await guild.bans.create(user, { reason: reason }) // API ban user from guild

	const nowDate = new Date(); // Create instance of 'Date' at present time of banning

	let unbannedTime; // Declare variable for initialising later; maintaining scope access
	
	if (seconds > 0) { // If seconds is undefined; permanent ban
		unbannedTime = new Date(nowDate.getTime() + (seconds * 1000)); // Form new time for unban
	}

	const ban = await Ban.create({ // Inserting data into 'Bans' collection
		userId: user.id,
		guildId: guild.id,
		bannedAt: nowDate, // Time of ban
		unbannedAt: unbannedTime, // Time of unban
		reason: reason ?? undefined, // Reason of ban
		moderatorId: user.id // ID of banned user
	});

	// Logging process
	if (log) { // If log is true
		const logsChannel = guild.channels.cache.get(logsChannelId); // Get log channel with ID

		const logEmbed = new EmbedBuilder() // Create embed for log message
			.setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() }); // Set author name and icon url to user being banned
		
		// Permanent ban
		if (unbannedTime === undefined) { // If ban is permanent
			logEmbed.setDescription(`${user} permanently banned by ${executor}`);
		}
		// Temporary ban
		else { // If ban is temporary
			const unixTimestamp = Math.round(unbannedTime.getTime() / 1000); // Create unix timestamp for using in embed

			logEmbed.setDescription(`${user} temporarily banned by ${executor}`); // Setting description for embed
			logEmbed.addFields({ name: "Expires", value: `<t:${unixTimestamp}:f>`}); // Creating field for expiry date of ban
		}
		
		logsChannel.send({ embeds: [logEmbed] }); // Sending message in logsChannel attached with embed
	}
}

// Slash command execution code
async function execute(interaction) {
	const { guild, member } = interaction;

	// Retrieving options from interaction command
	const user = interaction.options.getUser("user"); // User to ban; User or GuildMember. (required)
	const duration = interaction.options.getString("duration"); // Duration of ban; String or null
	const reason = interaction.options.getString("reason"); // Reason of ban; String or null

	const memberToBan = interaction.guild.members.cache.get(user.id); // Attempt to get member object from guild cache

	// !! ADD SUPERIOR ROLE CHECK !!

	// If client [bot] is not able to ban member (due to rank hierarchy)
	if (!memberToBan.bannable) {
		await sendInteractionRejectMessage(interaction, "Insufficient permission", "I cannot ban this user.");
		return; // Terminate rest of function code
	}

	// Check if user is already banned
	let userAlreadyBanned = true; // Declare variable with default value of true

	try {
		await guild.bans.fetch(user); // Attempt to fetch ban of user from API
	} catch (e) {
		if (e instanceof DiscordAPIError && e.code === 10026) { // If DiscordAPIError and code for 'Unknown Ban'
			userAlreadyBanned = false; // If couldn't fetch ban (no ban exists), set variable to true
		} else {
			handleDiscordAPIError(e); // Continue to throw error if not of error intended to catch
		}
	}

	// If user is already banned
	if (userAlreadyBanned) {
		await sendInteractionRejectMessage(interaction, "User already banned", "This user is already banned.");
		return; // Terminate rest of function code
	}

	// If permanent ban
	if (duration === null) {
		// Banning process
		await ban(user, member, { reason: reason }); // Permanently ban user from guild

		const replyEmbed = new EmbedBuilder() // Create embed to modify for posting
			.setAuthor({name: "Banned user", iconURL: user.displayAvatarURL()}) // Set heading and icon for embed
			.setDescription(`${user} has been permanently **banned**.`); // Set embed description

		await interaction.reply({ embeds: [replyEmbed] }); // Reply to command interaction with embed
	}
	// If temporary ban
	else {
		const [error, seconds] = parseDuration(duration, 60, maxBanDuration); // Parse duration string to attempt to format into seconds

		if (error) { // If error occurred when parsing duration string
			await sendInteractionRejectMessage(interaction, "Invalid usage", error);
			return; // Terminate rest of function code
		}

		// Banning process
		await ban(user, member, { seconds: seconds, reason: reason}); // Temporarily ban user from guild

		const replyEmbed = new EmbedBuilder() // Create embed to modify for posting
			.setAuthor({ name: "Banned user", iconURL: user.displayAvatarURL() }) // Set heading and icon for embed
			.setDescription(`${user} has been temporarily **banned**.`); // Set embed description
		
		await interaction.reply({ embeds: [replyEmbed] }); // Reply to command interaction with embed
	}
}

module.exports = {
	command: {
		data: command,
		execute
	},
	ban // 'ban' function
}