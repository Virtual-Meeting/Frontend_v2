import React, { useEffect, useState } from 'react';
import {
  EmojiPickerOverlay,
  EmojiPickerContainer,
  EmojiButton,
  TargetSelector,
  CloseButton,
  EmojiGrid,
  EmojiPickerHeader,
  HandRaiseContainer,
  HandRaiseButton
} from './EmojiPicker.styles';
import emojiList from './emojiList';

type EmojiPickerProps = {
  onSelect: (emoji: string, receiver: { sessionId: string; username: string } | null) => void;
  onClose: () => void;
  participants: { sessionId: string; username: string }[];
  currentUserSessionId: string;
  hasSidebar: boolean;
};


const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, participants, currentUserSessionId, hasSidebar }) => {
  const [targetSessionId, setTargetSessionId] = useState<string>('');
  const [handRaised, setHandRaised] = useState(false);
  const raisingHands = emojiList.find(e => e.name === 'Raising_Hands');

  const handleSelect = (emojiName: string) => {
    // const receiver = participants.find(p => p.sessionId === targetSessionId);
    // onSelect(emojiName, targetSessionId ? receiver ?? null : null);
    const receiver = participants[0] ?? null;
    onSelect(emojiName, receiver);
  };

  const handleToggleHand = () => {
    const newState = !handRaised; // 현재 상태 기준으로 전환값 계산

    setHandRaised(newState); // 상태 먼저 업데이트

    if (newState) {
      handleSelect('Raising_Hands'); // 손 들기 전송
    } else {
      handleSelect('Lowering_Hands'); //손 내리기 전송
    }
  };

  // ESC 눌러서 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <EmojiPickerOverlay onClick={onClose}>
      <EmojiPickerContainer $hasSidebar={hasSidebar} onClick={(e) => e.stopPropagation()}>
        <EmojiPickerHeader>
            <CloseButton onClick={onClose}>&times;</CloseButton>
        </EmojiPickerHeader>
        <EmojiGrid>
        {emojiList
        .filter((emoji) => emoji.name !== 'Raising_Hands')
        .map((emoji) => (
            <EmojiButton key={emoji.name} onClick={() => handleSelect(emoji.name)}>
            <emoji.Component width={28} height={28} />
            </EmojiButton>
        ))}
        </EmojiGrid>
        
        {/* <TargetSelector>
          <label>수신자:</label>
          <select
            value={targetSessionId}
            onChange={e => setTargetSessionId(e.target.value)}
            >
            <option value="" disabled hidden>수신자 선택</option>
            {participants
                .filter(p => p.sessionId !== currentUserSessionId)
                .filter((p, index, self) =>
                index === self.findIndex(other => other.sessionId === p.sessionId)
                ) 
                .map(p => (
                <option key={p.sessionId} value={p.sessionId}>
                    {p.username}
                </option>
                ))}
            </select>
        </TargetSelector> */}
        <HandRaiseContainer>
          <HandRaiseButton onClick={handleToggleHand}>
            <raisingHands.Component width={18} height={18}/>
            {handRaised ? '손 내리기' : '손 들기'}
          </HandRaiseButton>
        </HandRaiseContainer>
      </EmojiPickerContainer>
    </EmojiPickerOverlay>
  );
};

export default EmojiPicker;
