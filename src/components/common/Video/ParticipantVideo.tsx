import React, {
  forwardRef,
  useState,
  useEffect,
  useCallback,
  memo
} from "react";

import {
  ParticipantContainer,
  StyledVideo,
  UsernameOverlay,
  Placeholder,
  UsernameContent,
  Icon
} from "./ParticipantVideo.styles";

import EmojiEffects from "../EmojiEffects";
import useVoiceActivityDetection from "lib/hooks/useVoiceActivityDetection";
import useSpeakingScore from "lib/hooks/useSpeakingScore";
import { getUserColor } from "lib/color/colorManager";
import { useIconSet } from "lib/hooks/useIconSet";

type Props = {
  sessionId: string;
  username: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  emojiName?: string;
  mySessionId: string;
  isPreview?: boolean;
  className?: string;
  onSpeakingScoreChange?: (score: number) => void;
  volume?: number;
};

const ParticipantVideo = forwardRef<HTMLVideoElement, Props>(
  (
    {
      sessionId,
      username,
      isVideoOn,
      isAudioOn,
      emojiName,
      mySessionId,
      isPreview,
      onSpeakingScoreChange,
      className,
      volume = 50
    },
    ref
  ) => {
    const { RedMicOffIcon } = useIconSet();
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const handleLoadedMetadata = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        if (video.srcObject instanceof MediaStream) {
          setMediaStream(video.srcObject);
        }
      },
      []
    );

    useEffect(() => {
      const video = (ref as React.RefObject<HTMLVideoElement>)?.current;
      if (!video) return;

      const safeVolume =
        Number.isFinite(volume) && volume >= 0 && volume <= 100
          ? volume / 100
          : 0.5;

      video.volume = safeVolume;
    }, [volume, ref]);

    const isSpeaking = useVoiceActivityDetection(mediaStream, isAudioOn);
    const speakingScore = useSpeakingScore(isSpeaking);

    useEffect(() => {
      onSpeakingScoreChange?.(speakingScore);
    }, [speakingScore, onSpeakingScoreChange]);

    return (
      <ParticipantContainer
        id={sessionId}
        isPreview={isPreview}
        className={className}
        isSpeaking={isSpeaking}
      >
        <StyledVideo
          ref={ref}
          autoPlay
          playsInline
          muted={isPreview ? false : sessionId === mySessionId || !isAudioOn}
          width="16"
          height="9"
          style={{opacity: isVideoOn ? 1 : 0}}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {!isVideoOn && (
          <Placeholder
            bgColor={getUserColor(sessionId)}
            isPreview={isPreview}
          >
            <span>{username.charAt(0).toUpperCase()}</span>
          </Placeholder>
        )}

        <UsernameOverlay>
          <UsernameContent>
            {!isAudioOn && (
              <Icon>
                <RedMicOffIcon />
              </Icon>
            )}
            {username}
          </UsernameContent>
        </UsernameOverlay>

        <EmojiEffects emojiName={emojiName} />
      </ParticipantContainer>
    );
  }
);

export default memo(ParticipantVideo);