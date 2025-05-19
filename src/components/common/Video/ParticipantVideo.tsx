import React, { useRef, useEffect, forwardRef } from 'react';

type Props = {
  sessionId: string;
  username: string;
};

const ParticipantVideo = forwardRef<HTMLVideoElement, Props>(
  ({ sessionId, username }, ref) => {
    return (
      <div id={sessionId}>
        <video
            id={`video-${sessionId}`}
            ref={ref}
            autoPlay = {true}
            controls = {false}
            style={{ width: '100%' }}
        />
        <div>{username}</div>
      </div>
    );
  }
);

export default ParticipantVideo;
