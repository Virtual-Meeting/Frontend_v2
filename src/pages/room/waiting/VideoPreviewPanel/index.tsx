import React, { useEffect, useRef } from "react";
import ParticipantVideo from "components/common/Video/ParticipantVideo";

type VideoPreviewProps = {
  username: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
};

const VideoPreviewPanel: React.FC<VideoPreviewProps> = ({
  username,
  isVideoOn,
  isAudioOn,
  videoDeviceId,
  audioDeviceId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const constraints: MediaStreamConstraints = {
      video: isVideoOn
        ? videoDeviceId
          ? { deviceId: { exact: videoDeviceId } }
          : true
        : false,
      audio: isAudioOn
        ? audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : true
        : false,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("getUserMedia error:", error);
      });

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isVideoOn, isAudioOn, videoDeviceId, audioDeviceId]);

  return (
    <ParticipantVideo
      ref={videoRef}
      username={username}
      isVideoOn={isVideoOn}
      isAudioOn={isAudioOn}
      sessionId="local-preview"
      mySessionId="local-preview"
      isPreview={true}
    />
  );
};

export default VideoPreviewPanel;