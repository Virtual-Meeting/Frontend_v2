import React from 'react';
import { PanelWrapper, ParticipantsList } from './ParticipantsPanel.styles';
import Participant from 'lib/webrtc/Participant';
import ParticipantItem from './components/ParticipantItem'
import ParticipantHeader from './components/ParticipantHeader';
import CopyRoomUrlButton from 'components/common/CopyRoomUrlButton';

interface Props {
  participants: Participant[];
  participantsVisible: boolean;
  roomId: string;
  currentUserSessionId: string;
  raisedHandSessionIds: string[];
}

const ParticipantsPanel: React.FC<Props> = ({
  participants,
  participantsVisible,
  roomId,
  currentUserSessionId,
  raisedHandSessionIds,
}) => {
  // 현재 유저
  const currentUser = participants.find(p => p.sessionId === currentUserSessionId);

  // 본인 제외한 나머지
  const others = participants.filter(p => p.sessionId !== currentUserSessionId);

  // 손든 사람 (본인 제외)
  const raisedHands = others.filter(p => raisedHandSessionIds.includes(p.sessionId));

  // 손 안든 사람
  const notRaised = others.filter(p => !raisedHandSessionIds.includes(p.sessionId));

  // 최종 정렬: 나 → 손든 사람 → 그 외
  const sortedParticipants = [
    ...(currentUser ? [currentUser] : []),
    ...raisedHands,
    ...notRaised,
  ];

  return (
    <PanelWrapper participantsVisible={participantsVisible}>
      <ParticipantHeader count={participants.length}/>
      <ParticipantsList>
        {sortedParticipants.map((participant) => (
          <ParticipantItem 
            key={participant.sessionId} 
            participant={participant} 
            isHandRaised={raisedHandSessionIds.includes(participant.sessionId)}
          />
        ))}
      </ParticipantsList>
      <CopyRoomUrlButton roomId={roomId} />
    </PanelWrapper>
  );
};


export default ParticipantsPanel;
