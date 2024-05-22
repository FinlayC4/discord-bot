const channelVoiceMembers = new Map();

function addVoiceMember(member, channel) {
  const voiceMembers = channelVoiceMembers.get(channel.id);

  if (voiceMembers) {
    voiceMembers.set(member.id, new Date());
  } else {
    channelVoiceMembers.set(channel.id, new Map([[member.id, new Date()]]));
  }
}

function removeVoiceMember(member, channel) {
  const voiceMembers = channelVoiceMembers.get(channel.id);

  if (voiceMembers) {
    const success = voiceMembers.delete(member.id);

    if (success && voiceMembers.size === 0) {
      channelVoiceMembers.delete(channel.id);
    }
  }
}

/**
 * Gets members in voice of a voice-based channel in order.
 * @param {VoiceBasedChannel} channel - Voice based channel to get
 * @returns {Collection}
 */
function getVoiceMembers(channel) {
  const orderedMembers = channelVoiceMembers.get(channel.id); // returns Map or undefined

  if (!orderedMembers) {
    return channel.members;
  }

  const newOrderedMembers = channel.members.sorted((memberA, memberB) => {
    const memberAJoinDate = orderedMembers.get(memberA.id);

    if (memberAJoinDate) {
      const memberBJoinDate = orderedMembers.get(memberB.id);

      if (memberBJoinDate) {
        return memberAJoinDate - memberBJoinDate;
      }
    }
    return 0;
  });
  return newOrderedMembers;
}

module.exports = {
  addVoiceMember,
  removeVoiceMember,
  getVoiceMembers
};