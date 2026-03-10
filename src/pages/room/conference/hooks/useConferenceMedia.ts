import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClientMessage,
  LocalStreamRef,
  ParticipantsRef,
  UserDataRef,
  VideoRefsRef,
} from '../conference.types';

type UseConferenceMediaParams = {
  initialMicOn: boolean;
  initialVideoOn: boolean;
  initialAudioDeviceId?: string;
  initialVideoDeviceId?: string;
  participantsRef: ParticipantsRef;
  videoRefs: VideoRefsRef;
  localStreamRef: LocalStreamRef;
  userDataRef: UserDataRef;
  sendMessage: (message: ClientMessage) => void;
  setRecordingMicEnabled: (enabled: boolean) => void;
};

export function useConferenceMedia({
  initialMicOn,
  initialVideoOn,
  initialAudioDeviceId,
  initialVideoDeviceId,
  participantsRef,
  videoRefs,
  localStreamRef,
  userDataRef,
  sendMessage,
  setRecordingMicEnabled,
}: UseConferenceMediaParams) {

  const [micOn, setMicOn] = useState(initialMicOn);
  const [videoOn, setVideoOn] = useState(initialVideoOn);
  const [screenSharing, setScreenSharing] = useState(false);

  const [micListVisible, setMicListVisible] = useState(false);
  const [videoListVisible, setVideoListVisible] = useState(false);

  const [selectedMicId, setSelectedMicId] = useState<string | undefined>(initialAudioDeviceId);
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(initialVideoDeviceId);

  const micOnRef = useRef(micOn);
  const videoOnRef = useRef(videoOn);

  const displayStreamRef = useRef<MediaStream | null>(null);
  const originalTracksRef = useRef<{ video?: MediaStreamTrack; audio?: MediaStreamTrack }>({});

  /** mic 상태 sync **/
  useEffect(() => {
    micOnRef.current = micOn;

    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getAudioTracks().forEach(track => {
      track.enabled = micOn;
    });

    setRecordingMicEnabled(micOn);

  }, [micOn, localStreamRef, setRecordingMicEnabled]);

  /** video 상태 sync **/
  useEffect(() => {
    videoOnRef.current = videoOn;

    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach(track => {
      track.enabled = videoOn;
    });

  }, [videoOn, localStreamRef]);

  /** mic toggle **/
  const handleMicToggle = useCallback(() => {

    const next = !micOnRef.current;
    micOnRef.current = next;
    setMicOn(next);

    const sessionId = userDataRef.current.sessionId;
    if (!sessionId) return;

    sendMessage({
      eventId: 'audioStateChange',
      sessionId,
      audioOn: next
    });

  }, [sendMessage, userDataRef]);

  /** video toggle **/
  const handleVideoToggle = useCallback(() => {

    const next = !videoOnRef.current;
    videoOnRef.current = next;
    setVideoOn(next);

    const sessionId = userDataRef.current.sessionId;
    if (!sessionId) return;

    sendMessage({
      eventId: 'videoStateChange',
      sessionId,
      videoOn: next
    });

  }, [sendMessage, userDataRef]);

  /** mic 리스트 toggle **/
  const handleMicListToggle = useCallback(() => {
    setMicListVisible(prev => {
      if (!prev) setVideoListVisible(false);
      return !prev;
    });
  }, []);

  /** video 리스트 toggle **/
  const handleVideoListToggle = useCallback(() => {
    setVideoListVisible(prev => {
      if (!prev) setMicListVisible(false);
      return !prev;
    });
  }, []);

  /** 화면 공유 시작 **/
  const startScreenSharing = useCallback(async () => {

    const selfSessionId = userDataRef.current.sessionId;
    const participant = participantsRef.current[selfSessionId];
    if (!participant?.rtcPeer) return;

    const peerConnection = participant.rtcPeer.peerConnection;

    const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
    const audioSender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');

    if (!videoSender || !audioSender) return;

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
    });

    const screenTrack = displayStream.getVideoTracks()[0];
    const micTrack = micStream.getAudioTracks()[0];

    if (!screenTrack || !micTrack) return;

    micTrack.enabled = micOnRef.current;

    displayStream.addTrack(micTrack);
    displayStreamRef.current = displayStream;

    originalTracksRef.current = {
      video: videoSender.track ?? undefined,
      audio: audioSender.track ?? undefined,
    };

    await videoSender.replaceTrack(screenTrack);
    await audioSender.replaceTrack(micTrack);

    const localVideoEl = videoRefs.current[selfSessionId]?.current;

    if (localVideoEl) {
      localVideoEl.srcObject = displayStream;
    }

    screenTrack.addEventListener(
      'ended',
      () => {
        void stopScreenSharing();
      },
      { once: true }
    );

    setScreenSharing(true);

  }, [participantsRef, selectedMicId, userDataRef, videoRefs]);

  /** 화면 공유 종료 **/
  const stopScreenSharing = useCallback(async () => {

    const selfSessionId = userDataRef.current.sessionId;
    const participant = participantsRef.current[selfSessionId];
    if (!participant?.rtcPeer) return;

    const peerConnection = participant.rtcPeer.peerConnection;

    const videoSender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
    const audioSender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');

    if (!videoSender || !audioSender) return;

    const original = originalTracksRef.current;

    if (original.video) await videoSender.replaceTrack(original.video);
    if (original.audio) await audioSender.replaceTrack(original.audio);

    displayStreamRef.current?.getTracks().forEach(track => track.stop());

    displayStreamRef.current = null;

    const localVideoEl = videoRefs.current[selfSessionId]?.current;

    if (localVideoEl && localStreamRef.current) {
      localVideoEl.srcObject = localStreamRef.current;
    }

    originalTracksRef.current = {};
    setScreenSharing(false);

  }, [participantsRef, userDataRef, videoRefs, localStreamRef]);

  const handleScreenSharingToggle = useCallback(async () => {

    if (screenSharing) {
      await stopScreenSharing();
      return;
    }

    await startScreenSharing();

  }, [screenSharing, startScreenSharing, stopScreenSharing]);

  /** mic device 변경 **/
  const handleMicDeviceChange = useCallback((deviceId: string) => {

    if (deviceId === selectedMicId) return;

    setSelectedMicId(deviceId);

  }, [selectedMicId]);

  /** video device 변경 **/
  const handleVideoDeviceChange = useCallback((deviceId: string) => {

    if (deviceId === selectedVideoId) return;

    setSelectedVideoId(deviceId);

  }, [selectedVideoId]);

  /** cleanup **/
  const cleanupMedia = useCallback(() => {

    displayStreamRef.current?.getTracks().forEach(track => track.stop());
    displayStreamRef.current = null;

    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;

  }, [localStreamRef]);

  return {
    micOn,
    videoOn,
    micOnRef,
    videoOnRef,
    screenSharing,
    micListVisible,
    videoListVisible,
    selectedMicId,
    selectedVideoId,
    handleMicToggle,
    handleVideoToggle,
    handleMicListToggle,
    handleVideoListToggle,
    handleMicDeviceChange,
    handleVideoDeviceChange,
    handleScreenSharingToggle,
    cleanupMedia,
  };
}