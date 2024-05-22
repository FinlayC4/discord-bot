const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	getVoiceConnection,
	VoiceConnectionStatus,
	entersState,
	AudioPlayerStatus
} = require('@discordjs/voice');

const play = require("play-dl")

const queues = new Map();

async function handleDisconnect(voiceConnection) {
	try {
		await Promise.race([
			entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5000),
			entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5000),
		]);
		// Seems to be reconnecting to a new channel - ignore disconnect
	} catch (error) {
		// Seems to be a real disconnect which SHOULDN'T be recovered from
		if (voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
			voiceConnection.destroy();
		}
	}
}

function createVoiceConnectionWithPlayer(voiceChannel) {
	const guild = voiceChannel.guild;

	const voiceConnection = joinVoiceChannel({
		channelId: voiceChannel.id,
		guildId: guild.id,
		adapterCreator: guild.voiceAdapterCreator
	});

	voiceConnection.on(VoiceConnectionStatus.Disconnected,
		(oldState, newState) => handleDisconnect(voiceConnection));

	voiceConnection.on(VoiceConnectionStatus.Destroyed,
		() => {
			clearQueue(guild.id);
			console.log("destroyed voice connection")
		}
	);

	const player = createAudioPlayer();
	player.on(AudioPlayerStatus.Idle, () => {

		removeFromQueue(guild.id, 0);
		processQueue(guild.id, player)
	});

	voiceConnection.subscribe(player);

	return voiceConnection;
}


function addToQueue(member, videoInfo) {
	const guild = member.guild;

	const queue = queues.get(guild.id);

	const requestData = { memberId: member.id, videoInfo };

	if (queue) {
		queue.push(requestData);
	} else {
		queues.set(guild.id, [requestData]);
	}
}

function removeFromQueue(guildId, index) {
	const queue = queues.get(guildId);
	if (queue) {
		const removed = queue.splice(index, 1);
		if (removed.length > 0) {
			return true;
		}
	}
	return false;
}

function getQueue(guildId) {
	const queue = queues.get(guildId) ?? [];
	return queue;
}

function clearQueue(guildId) {
	return queues.delete(guildId);
}

async function processQueue(guildId, player) {
	const queue = getQueue(guildId);
	if (queue.length !== 0) {
		const requestData = queue[0];

		const stream = await play.stream(requestData.videoInfo.url)

		const resource = createAudioResource(stream.stream, { inputType: stream.type });

		player.play(resource);
	}
}

module.exports = {
	createVoiceConnectionWithPlayer,
	getQueue,
	clearQueue,
	addToQueue,
	removeFromQueue,
	processQueue
}