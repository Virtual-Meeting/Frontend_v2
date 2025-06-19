import React from 'react';
import Participant from 'lib/webrtc/Participant';
import { ItemWrapper, Avatar, Username, StatusIcons } from './ParticipantItem.styles';
import { RaisingHands } from 'assets/images/emojis';

interface Props {
  participant: Participant;
  isHandRaised: boolean;
}

const ParticipantItem: React.FC<Props> = ({ participant, isHandRaised }) => {
  return (
    <ItemWrapper>
      <Avatar>{participant.username.charAt(0).toUpperCase()}</Avatar>
      <Username>{participant.username}</Username>
      <StatusIcons>
        {isHandRaised && <RaisingHands/>}
      </StatusIcons>
    </ItemWrapper>
  );
};

export default ParticipantItem;
