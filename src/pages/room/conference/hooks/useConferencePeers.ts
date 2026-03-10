import { createRef, useCallback, useRef, useState } from 'react';
import * as kurentoUtils from 'kurento-utils';
import Participant from 'lib/webrtc/Participant';
import type {
  ClientMessage,
  LocalStreamRef,
  ParsedParticipant,
  ParticipantsRef,
  RoomLeader,
  UserDataRef,
  UserDataSetter,
  VideoRefsRef,
} from '../conference.types';
import { normalizeBoolean } from '../conference.types';

const iceServers: RTCIceServer[] = [
  { urls: import.meta.env.VITE_STUN_SERVER_1 },
  { urls: import.meta.env.VITE_STUN_SERVER_2 },
  { urls: import.meta.env.VITE_STUN_SERVER_3 },
  {
    urls: import.meta.env.VITE_TURN_SERVER,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  },
];

type UseConferencePeersParams = {
  sendMessage: (message: ClientMessage) => void;
  participantsRef: ParticipantsRef;
  videoRefs: VideoRefsRef;
  localStreamRef: LocalStreamRef;
  userDataRef: UserDataRef;
  setUserData: UserDataSetter;
  micOn: boolean;
  videoOn: boolean;
  selectedMicId?: string;
  selectedVideoId?: string;
  onSelfExit: () => void;
  addSystemMessage: (content: string) => void;
};

export function useConferencePeers({
  sendMessage,
  participantsRef,
  videoRefs,
  localStreamRef,
  userDataRef,
  setUserData,
  micOn,
  videoOn,
  selectedMicId,
  selectedVideoId,
  onSelfExit,
  addSystemMessage,
}: UseConferencePeersParams) {
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidate[]>>(new Map());

  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [roomLeader, setRoomLeader] = useState<RoomLeader>({
    sessionId: '',
    username: '',
  });
  const [participantVolumes, setParticipantVolumes] = useState<Record<string, number>>({});
  const [speakingScores, setSpeakingScores] = useState<Record<string, number>>({});

  const ensureVideoRef = useCallback(
    (sessionId: string) => {
      if (!videoRefs.current[sessionId]) {
        videoRefs.current[sessionId] = createRef<HTMLVideoElement>();
      }
      return videoRefs.current[sessionId];
    },
    [videoRefs],
  );

  const parseParticipant = useCallback((participantInfo: unknown): ParsedParticipant | null => {
    try {
      const parsed =
        typeof participantInfo === 'string'
          ? JSON.parse(participantInfo)
          : participantInfo;

      if (!parsed || typeof parsed !== 'object') return null;

      const participant = parsed as {
        sessionId: string;
        username: string;
        audioOn?: boolean | string;
        videoOn?: boolean | string;
      };

      if (!participant.sessionId || !participant.username) return null;

      return {
        sessionId: participant.sessionId,
        username: participant.username,
        audioOn: normalizeBoolean(participant.audioOn),
        videoOn: normalizeBoolean(participant.videoOn),
      };
    } catch (error) {
      console.error('❌ 참가자 파싱 실패:', participantInfo, error);
      return null;
    }
  }, []);

  const flushCandidateQueue = useCallback(
    (sessionId: string) => {
      const participant = participantsRef.current[sessionId];
      const queue = iceCandidateQueue.current.get(sessionId);
      if (!participant?.rtcPeer || !queue?.length) return;

      queue.forEach((candidate) => {
        participant.rtcPeer.addIceCandidate(candidate);
      });

      iceCandidateQueue.current.delete(sessionId);
    },
    [participantsRef],
  );

  const createRecvPeerWhenReady = useCallback(
    (sender: ParsedParticipant, participant: Participant) => {
      let retryCount = 0;
      const MAX_RETRY = 240;

      const tryCreatePeer = () => {
        const videoElement = videoRefs.current[sender.sessionId]?.current;

        if (!videoElement) {
          if (retryCount >= MAX_RETRY) {
            console.warn('remote video element mount 실패:', sender.sessionId);
            return;
          }

          retryCount += 1;
          requestAnimationFrame(tryCreatePeer);
          return;
        }

        if (participant.rtcPeer) return;

        const options = {
          configuration: { iceServers },
          remoteVideo: videoElement,
          onicecandidate: participant.onIceCandidate.bind(participant),
        };

        participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
          options,
          function (error: unknown) {
            if (error) {
              console.error('WebRtcPeerRecvonly 생성 실패:', error);
              return;
            }

            this.generateOffer(participant.offerToReceiveVideo.bind(participant));
            flushCandidateQueue(sender.sessionId);
          },
        );

        participant.rtcPeer.peerConnection.addEventListener(
          'connectionstatechange',
          () => {
            const state = participant.rtcPeer.peerConnection.connectionState;

            if (state === 'connected') {
              flushCandidateQueue(sender.sessionId);
            }

            if (state === 'failed') {
              console.warn('WebRTC 연결 실패:', sender.sessionId);
              try {
                participant.dispose();
              } catch (error) {
                console.warn('participant dispose error:', error);
              }
            }
          },
        );
      };

      tryCreatePeer();
    },
    [flushCandidateQueue, videoRefs],
  );

  const receiveVideo = useCallback(
    (sender: ParsedParticipant) => {
      let participant = participantsRef.current[sender.sessionId];

      ensureVideoRef(sender.sessionId);

      if (!participant) {
        participant = new Participant(
          sender.sessionId,
          sender.username,
          sendMessage,
          sender.videoOn,
          sender.audioOn,
        );

        participantsRef.current[sender.sessionId] = participant;

        setParticipants((prev) => ({
          ...prev,
          [sender.sessionId]: participant!,
        }));

        setParticipantVolumes((prev) =>
          prev[sender.sessionId] !== undefined
            ? prev
            : { ...prev, [sender.sessionId]: 50 },
        );

        setSpeakingScores((prev) => ({
          ...prev,
          [sender.sessionId]: 0,
        }));
      }

      createRecvPeerWhenReady(sender, participant);
    },
    [createRecvPeerWhenReady, ensureVideoRef, participantsRef, sendMessage],
  );

  const createSendPeerWhenReady = useCallback(
    (
      sessionId: string,
      participant: Participant,
      stream: MediaStream,
      onReady: () => void,
    ) => {
      let retryCount = 0;
      const MAX_RETRY = 240;

      const tryCreatePeer = () => {
        const localVideoEl = videoRefs.current[sessionId]?.current;

        if (!localVideoEl) {
          if (retryCount >= MAX_RETRY) {
            console.warn('local video element mount 실패:', sessionId);
            return;
          }

          retryCount += 1;
          requestAnimationFrame(tryCreatePeer);
          return;
        }

        if (participant.rtcPeer) return;

        localVideoEl.srcObject = stream;

        const options = {
          configuration: { iceServers },
          localVideo: localVideoEl,
          mediaConstraints: { audio: true, video: true },
          onicecandidate: participant.onIceCandidate.bind(participant),
        };

        participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(
          options,
          function (error: unknown) {
            if (error) {
              console.error('WebRtcPeerSendonly 생성 오류:', error);
              return;
            }

            this.peerConnection.addEventListener('iceconnectionstatechange', () => {
              console.log(`ICE 상태: ${this.peerConnection.iceConnectionState}`);
            });

            this.generateOffer(participant.offerToReceiveVideo.bind(participant));
            flushCandidateQueue(sessionId);
            onReady();
          },
        );
      };

      tryCreatePeer();
    },
    [flushCandidateQueue, videoRefs],
  );

  const sendExistingUsers = useCallback(
    (msg: {
      sessionId: string;
      username: string;
      roomId?: string;
      roomLeaderId?: string;
      roomLeaderName?: string;
      audioOn?: boolean | string;
      videoOn?: boolean | string;
      participants?: unknown[];
    }) => {
      const participant = new Participant(
        msg.sessionId,
        msg.username,
        sendMessage,
        normalizeBoolean(msg.videoOn),
        normalizeBoolean(msg.audioOn),
      );
      participantsRef.current[msg.sessionId] = participant;

      setRoomLeader({
        sessionId: msg.roomLeaderId ?? '',
        username: msg.roomLeaderName ?? '',
      });

      setParticipants((prev) => ({
        ...prev,
        [msg.sessionId]: participant,
      }));

      setParticipantVolumes((prev) =>
        prev[msg.sessionId] !== undefined
          ? prev
          : { ...prev, [msg.sessionId]: 50 },
      );

      setSpeakingScores((prev) => ({
        ...prev,
        [msg.sessionId]: 0,
      }));

      setUserData((prev) => ({
        ...prev,
        sessionId: msg.sessionId,
      }));

      if (msg.roomId) {
        addSystemMessage(`📢 현재 방 코드: ${msg.roomId}`);
      } else if (userDataRef.current.roomId) {
        addSystemMessage(`📢 현재 방 코드: ${userDataRef.current.roomId}`);
      }

      ensureVideoRef(msg.sessionId);

      const VIDEO_CONSTRAINTS = {
        width: { ideal: 320, max: 320 },
        height: { ideal: 240, max: 240 },
        frameRate: { ideal: 10, max: 10 },
      };

      navigator.mediaDevices
        .getUserMedia({
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
          video: selectedVideoId
            ? { deviceId: { exact: selectedVideoId }, ...VIDEO_CONSTRAINTS }
            : VIDEO_CONSTRAINTS,
        })
        .then((stream) => {
          localStreamRef.current = stream;

          stream.getAudioTracks().forEach((track) => {
            track.enabled = micOn;
          });

          stream.getVideoTracks().forEach((track) => {
            track.enabled = videoOn;
          });

          createSendPeerWhenReady(msg.sessionId, participant, stream, () => {
            if (Array.isArray(msg.participants)) {
              msg.participants
                .map(parseParticipant)
                .filter(
                  (participant): participant is ParsedParticipant => participant !== null,
                )
                .forEach(receiveVideo);
            }
          });
        })
        .catch((error) => {
          console.error('로컬 미디어 접근 오류:', error);
        });
    },
    [
      addSystemMessage,
      createSendPeerWhenReady,
      ensureVideoRef,
      localStreamRef,
      micOn,
      parseParticipant,
      participantsRef,
      receiveVideo,
      selectedMicId,
      selectedVideoId,
      sendMessage,
      setUserData,
      userDataRef,
      videoOn,
    ],
  );

  const roomCreated = useCallback(
    (response: {
      sessionId: string;
      username: string;
      roomId: string;
      roomLeaderId: string;
      roomLeaderName: string;
      audioOn?: boolean | string;
      videoOn?: boolean | string;
    }) => {
      setUserData((prev) => ({
        ...prev,
        sessionId: response.sessionId,
        roomId: response.roomId,
      }));
      sendExistingUsers(response);
    },
    [sendExistingUsers, setUserData],
  );

  const receiveVideoResponse = useCallback(
    (result: { sessionId: string; sdpAnswer: string }) => {
      const participant = participantsRef.current[result.sessionId];
      if (!participant?.rtcPeer) {
        console.error(`rtcPeer for participant ${result.sessionId} is not initialized.`);
        return;
      }

      participant.rtcPeer.processAnswer(result.sdpAnswer, (error: unknown) => {
        if (error) {
          console.error('Error processing SDP answer:', error);
          return;
        }

        flushCandidateQueue(result.sessionId);
      });
    },
    [flushCandidateQueue, participantsRef],
  );

  const onIceCandidate = useCallback(
    (message: { sessionId: string; candidate: RTCIceCandidateInit }) => {
      const { sessionId, candidate } = message;
      const participant = participantsRef.current[sessionId];
      if (!participant) return;

      const iceCandidate = new RTCIceCandidate(candidate);

      if (!participant.rtcPeer) {
        const queue = iceCandidateQueue.current.get(sessionId) ?? [];
        queue.push(iceCandidate);
        iceCandidateQueue.current.set(sessionId, queue);
        return;
      }

      participant.rtcPeer.addIceCandidate(iceCandidate);
    },
    [participantsRef],
  );

  const userLeft = useCallback(
    (request: { sessionId: string }) => {
      const sessionId = request.sessionId;

      if (sessionId === userDataRef.current.sessionId) {
        Object.values(participantsRef.current).forEach((participant) => {
          try {
            participant.dispose();
          } catch (error) {
            console.warn('dispose error:', error);
          }
        });

        participantsRef.current = {};
        videoRefs.current = {};
        iceCandidateQueue.current.clear();

        setParticipants({});
        setParticipantVolumes({});
        setSpeakingScores({});

        onSelfExit();
        return;
      }

      const participant = participantsRef.current[sessionId];
      if (!participant) return;

      addSystemMessage(`${participant.username}님이 퇴장했습니다.`);

      try {
        participant.dispose();
      } catch (error) {
        console.warn('participant dispose error:', error);
      }

      const videoEl = videoRefs.current[sessionId]?.current;
      if (videoEl) {
        videoEl.srcObject = null;
      }

      delete participantsRef.current[sessionId];
      delete videoRefs.current[sessionId];
      iceCandidateQueue.current.delete(sessionId);

      setParticipants((prev) => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });

      setParticipantVolumes((prev) => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });

      setSpeakingScores((prev) => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });
    },
    [addSystemMessage, onSelfExit, participantsRef, userDataRef, videoRefs],
  );

  const handleLeaderChanged = useCallback((data: { roomLeaderId: string; roomLeadername?: string; roomLeaderName?: string }) => {
    setRoomLeader({
      sessionId: data.roomLeaderId,
      username: data.roomLeaderName ?? data.roomLeadername ?? '',
    });
  }, []);

  const handleAudioStateChange = useCallback((msg: { sessionId: string; audioOn: boolean }) => {
    setParticipants((prev) => {
      const updated = { ...prev };
      if (updated[msg.sessionId]) {
        updated[msg.sessionId].audioOn = msg.audioOn;
      }
      return updated;
    });

    if (participantsRef.current[msg.sessionId]) {
      participantsRef.current[msg.sessionId].audioOn = msg.audioOn;
    }
  }, [participantsRef]);

  const handleVideoStateChange = useCallback((msg: { sessionId: string; videoOn: boolean }) => {
    setParticipants((prev) => {
      const updated = { ...prev };
      if (updated[msg.sessionId]) {
        updated[msg.sessionId].videoOn = msg.videoOn;
      }
      return updated;
    });

    if (participantsRef.current[msg.sessionId]) {
      participantsRef.current[msg.sessionId].videoOn = msg.videoOn;
    }
  }, [participantsRef]);

  const handleUsernameChanged = useCallback((data: { sessionId: string; newUserName: string }) => {
    setParticipants((prev) => {
      const updated = { ...prev };
      if (updated[data.sessionId]) {
        updated[data.sessionId].username = data.newUserName;
      }
      return updated;
    });

    if (participantsRef.current[data.sessionId]) {
      participantsRef.current[data.sessionId].username = data.newUserName;
    }

    if (data.sessionId === userDataRef.current.sessionId) {
      setUserData((prev) => ({
        ...prev,
        username: data.newUserName,
      }));
    }
  }, [participantsRef, setUserData, userDataRef]);

  const cleanupPeers = useCallback(() => {
    Object.values(participantsRef.current).forEach((participant) => {
      try {
        participant.dispose();
      } catch (error) {
        console.warn('dispose error:', error);
      }
    });

    participantsRef.current = {};
    videoRefs.current = {};
    iceCandidateQueue.current.clear();
  }, [participantsRef, videoRefs]);

  return {
    participants,
    roomLeader,
    participantVolumes,
    speakingScores,
    setParticipantVolumes,
    setSpeakingScores,
    receiveVideo,
    sendExistingUsers,
    roomCreated,
    receiveVideoResponse,
    onIceCandidate,
    userLeft,
    handleLeaderChanged,
    handleAudioStateChange,
    handleVideoStateChange,
    handleUsernameChanged,
    cleanupPeers,
  };
}