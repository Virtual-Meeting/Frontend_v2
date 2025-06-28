import React from 'react';
import { Overlay, Popup, Message, ButtonGroup, ConfirmButton } from './RecordingPermissionResultPopup.styles';

type Props = {
  granted: boolean;
  onClose: () => void;
  onStartRecording?: () => void;
};

const RecordingPermissionResultPopup: React.FC<Props> = ({
  granted,
  onClose,
  onStartRecording,
}) => {
  return (
    <Overlay>
      <Popup>
        <Message>
          {granted
            ? '호스트가 녹화를 허용했습니다. 녹화를 시작하시겠습니까?'
            : '호스트가 녹화를 거절했습니다.'}
        </Message>

        {granted ? (
          <ButtonGroup>
            <ConfirmButton
              variant="primary"
              onClick={() => {
                if (onStartRecording) onStartRecording();
                onClose();
              }}
            >
              녹화 시작
            </ConfirmButton>
          </ButtonGroup>
        ) : (
          <ConfirmButton variant="primary" onClick={onClose}>
            확인
          </ConfirmButton>
        )}
      </Popup>
    </Overlay>
  );
};

export default RecordingPermissionResultPopup;
