import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from 'components/common/Header';
import Participant from 'lib/webrtc/Participant';
import ParticipantVideo from 'components/common/Video/ParticipantVideo';
import CallControls from 'components/common/CallControls';
import { Wrapper, GalleryWrapper, MainArea, ParticipantVideoGroup } from './Conference.styles';
import Sidebar from 'components/common/Sidebar';
import { ChatMessage, ChatMessageInput } from 'types/chat';
import { EmojiMessage } from 'types/emoji';
import EmojiPicker from 'components/common/EmojiPicker';
import RecordingStatusPopup from 'components/common/Recording/RecordingStatusPopup';
import ListPopup from 'components/common/ListPopup';
import RecordingPermissionPopup from 'components/common/Recording/RecordingPermissionPopup';
import RecordingConsentPopup from 'components/common/Recording/RecordingConsentPopup';
import RecordingPermissionResultPopup from 'components/common/Recording/RecordingPermissionResultPopup';
import NameChangePopup from 'components/common/NameChangePopup';
import AudioInputSelector from 'components/common/UserSettings/AudioInputSelector';
import VideoInputSelector from 'components/common/UserSettings/VideoInputSelector';

import { useTopSpeaker } from 'lib/hooks/useTopSpeaker';

import type {
  ClientMessage,
  ServerMessage,
  SystemMessage,
  UserData,
  VideoRefMap,
} from './conference.types';
import { normalizeBoolean } from './conference.types';
import { useConferenceRecording } from './hooks/useConferenceRecording';
import { useConferenceMedia } from './hooks/useConferenceMedia';
import { useConferencePeers } from './hooks/useConferencePeers';

const wsServerUrl = import.meta.env.VITE_WS_SERVER_URL as string;

type ConferenceProps = {
  name: string;
  roomId: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const Conference: React.FC<ConferenceProps> = ({
  name,
  roomId,
  isVideoOn,
  isAudioOn,
  videoDeviceId,
  audioDeviceId,
  isDarkMode,
  toggleDarkMode,
}) => {
  const navigate = useNavigate();
  const isJoin = roomId.trim().length > 0;

  // 중요 연결 ref들은 페이지에서 1회만 생성
  const wsRef = useRef<WebSocket | null>(null);
  const participantsRef = useRef<Record<string, Participant>>({});
  const videoRefs = useRef<VideoRefMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const [userData, setUserData] = useState<UserData>({
    sessionId: '',
    username: name,
    roomId,
    audioOn: isAudioOn,
    videoOn: isVideoOn,
  });
  const userDataRef = useRef(userData);

  const [participantsVisible, setParticipantsVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [emotesVisible, setEmotesVisible] = useState(false);
  const [changeNamePopupVisible, setChangeNamePopupVisible] = useState(false);
  const [captionsVisible, setCaptionsVisible] = useState(false);

  const [recordingListVisible, setRecordingListVisible] = useState(false);
  const [recordingPopupVisible, setRecordingPopupVisible] = useState(false);
  const [recordingConsentPopupVisible, setRecordingConsentPopupVisible] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [emojiMessages, setEmojiMessages] = useState<EmojiMessage[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [raisedHandSessionIds, setRaisedHandSessionIds] = useState<string[]>([]);
  const [handRaised, setHandRaised] = useState(false);

  const hasSidebar = chatVisible || participantsVisible;

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const connectMessage = useMemo<ClientMessage>(() => {
    if (isJoin) {
      return {
        eventId: 'joinRoom',
        username: name,
        roomId,
        audioOn: isAudioOn,
        videoOn: isVideoOn,
      };
    }

    return {
      eventId: 'createRoom',
      username: name,
      audioOn: isAudioOn,
      videoOn: isVideoOn,
    };
  }, [isAudioOn, isJoin, isVideoOn, name, roomId]);

  const sendMessage = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  }, []);

  const recording = useConferenceRecording();

  const addSystemMessage = useCallback((content: string) => {
    setSystemMessages((prev) => [
      ...prev,
      {
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const media = useConferenceMedia({
    initialMicOn: isAudioOn,
    initialVideoOn: isVideoOn,
    initialAudioDeviceId: audioDeviceId,
    initialVideoDeviceId: videoDeviceId,
    participantsRef,
    videoRefs,
    localStreamRef,
    userDataRef,
    sendMessage,
    setRecordingMicEnabled: recording.setMicEnabled,
  });

  const peers = useConferencePeers({
    sendMessage,
    participantsRef,
    videoRefs,
    localStreamRef,
    userDataRef,
    setUserData,
    micOn: media.micOn,
    videoOn: media.videoOn,
    selectedMicId: media.selectedMicId,
    selectedVideoId: media.selectedVideoId,
    onSelfExit: () => navigate('/'),
    addSystemMessage,
  });

  const topSpeaker = useTopSpeaker(peers.speakingScores);

  const sortedSpeakerIds = useMemo(() => {
    const ids = Object.keys(peers.participants);
    if (!topSpeaker?.id) return ids;
    return [topSpeaker.id, ...ids.filter((id) => id !== topSpeaker.id)];
  }, [peers.participants, topSpeaker]);

  const handleSpeakingScoreChange = useCallback(
    (sessionId: string, score: number) => {
      peers.setSpeakingScores((prev) => {
        if (prev[sessionId] === score) return prev;
        return { ...prev, [sessionId]: score };
      });
    },
    [peers],
  );

  const handleChatMessage = useCallback(
    (
      data: {
        senderSessionId: string;
        senderName: string;
        receiverSessionId: string;
        receiverName: string;
        message: string;
      },
      isPrivate: boolean,
    ) => {
      const chat: ChatMessage = {
        type: isPrivate ? 'private' : 'public',
        from: data.senderName,
        to: data.receiverName,
        content: data.message,
        sessionId: data.senderSessionId,
      };

      setChatMessages((prev) => [...prev, chat]);
    },
    [],
  );

  const sendChatMessage = useCallback(
    ({ to, content, isPrivate }: ChatMessageInput) => {
      const newMessage: ChatMessage = {
        type: isPrivate ? 'private' : 'public',
        from: userData.username,
        to,
        content,
        sessionId: userData.sessionId,
      };

      setChatMessages((prev) => [...prev, newMessage]);

      if (isPrivate) {
        sendMessage({
          eventId: 'sendPersonalChat',
          receiverSessionId: to,
          message: content,
        });
        return;
      }

      sendMessage({
        eventId: 'broadcastChat',
        message: content,
      });
    },
    [sendMessage, userData.sessionId, userData.username],
  );

  const handleEmojiMessage = useCallback(
    (data: {
      senderSessionId: string;
      senderName: string;
      receiverSessionId?: string;
      receiverName?: string;
      emoji: string;
    }) => {
      const emojiMessage: EmojiMessage = {
        from: data.senderName,
        to: data.receiverName ?? '',
        emoji: data.emoji,
        sessionId: topSpeaker.id,
      };

      setEmojiMessages((prev) => [
        ...prev.filter((m) => m.sessionId !== emojiMessage.sessionId),
        emojiMessage,
      ]);

      if (data.emoji === 'Raising_Hands') {
        setRaisedHandSessionIds((prev) => {
          if (!prev.includes(data.senderSessionId)) {
            return [...prev, data.senderSessionId];
          }
          return prev;
        });
      }

      setTimeout(() => {
        setEmojiMessages((prev) =>
            prev.filter((m) => m.sessionId !== emojiMessage.sessionId)
        );
      }, 3000);
    },
    [topSpeaker]
  );

  const handleRecordingToggle = useCallback(() => {
    if (recording.recording) {
      sendMessage({ eventId: 'stopRecording' });
      return;
    }

    if (peers.roomLeader.sessionId === userDataRef.current.sessionId) {
      sendMessage({ eventId: 'startRecording' });
      return;
    }

    sendMessage({ eventId: 'requestRecordingPermission' });
  }, [peers.roomLeader.sessionId, recording.recording, sendMessage]);

  const handleStartRecording = useCallback(() => {
    sendMessage({ eventId: 'startRecording' });
    setGranted(null);
  }, [sendMessage]);

  const exitRoom = useCallback(() => {
    const sessionId = userDataRef.current.sessionId;

    if (sessionId) {
        sendMessage({
        eventId: 'exitRoom',
        sessionId
        });
    }

    media.cleanupMedia();

    peers.cleanupPeers();

    wsRef.current?.close();
    wsRef.current = null;

    navigate('/');

    }, [media, navigate, peers, sendMessage]);

  // 소켓 핸들러는 ref로 최신 로직만 교체하고, WebSocket 자체는 다시 열지 않음
  const socketHandlersRef = useRef<(message: ServerMessage) => void>(() => {});

  socketHandlersRef.current = (parsedMessage: ServerMessage) => {
    if (
      parsedMessage.type === 'ERROR' &&
      parsedMessage.message?.includes('존재하지 않는 방입니다')
    ) {
      alert(parsedMessage.message);
      navigate('/');
      return;
    }

    switch (parsedMessage.action) {
      case 'roomCreated':
        if (
          parsedMessage.sessionId &&
          parsedMessage.username &&
          parsedMessage.roomId &&
          parsedMessage.roomLeaderId &&
          parsedMessage.roomLeaderName
        ) {
          peers.roomCreated({
            sessionId: parsedMessage.sessionId,
            username: parsedMessage.username,
            roomId: parsedMessage.roomId,
            roomLeaderId: parsedMessage.roomLeaderId,
            roomLeaderName: parsedMessage.roomLeaderName,
            audioOn: normalizeBoolean(parsedMessage.audioOn),
            videoOn: normalizeBoolean(parsedMessage.videoOn)
          });
        }
        break;

      case 'sendExistingUsers':
        if (parsedMessage.sessionId && parsedMessage.username) {
          peers.sendExistingUsers({
            sessionId: parsedMessage.sessionId,
            username: parsedMessage.username,
            roomId: parsedMessage.roomId,
            roomLeaderId: parsedMessage.roomLeaderId,
            roomLeaderName: parsedMessage.roomLeaderName,
            audioOn: parsedMessage.audioOn,
            videoOn: parsedMessage.videoOn,
            participants: parsedMessage.participants,
          });
        }
        break;

      case 'newUserJoined':
        if (parsedMessage.sessionId && parsedMessage.username) {
          peers.receiveVideo({
            sessionId: parsedMessage.sessionId,
            username: parsedMessage.username,
            audioOn: normalizeBoolean(parsedMessage.audioOn),
            videoOn: normalizeBoolean(parsedMessage.videoOn),
          });
        }
        break;

      case 'onIceCandidate':
        if (parsedMessage.sessionId && parsedMessage.candidate) {
          peers.onIceCandidate({
            sessionId: parsedMessage.sessionId,
            candidate: parsedMessage.candidate,
          });
        }
        break;

      case 'receiveVideoAnswer':
        if (parsedMessage.sessionId && parsedMessage.sdpAnswer) {
          peers.receiveVideoResponse({
            sessionId: parsedMessage.sessionId,
            sdpAnswer: parsedMessage.sdpAnswer,
          });
        }
        break;

      case 'exitRoom':
        if (parsedMessage.sessionId) {
          peers.userLeft({ sessionId: parsedMessage.sessionId });
        }
        break;

      case 'leaderChanged':
        if (parsedMessage.roomLeaderId) {
          peers.handleLeaderChanged({
            roomLeaderId: parsedMessage.roomLeaderId,
            roomLeadername: parsedMessage.roomLeadername,
            roomLeaderName: parsedMessage.roomLeaderName,
          });
        }
        break;

      case 'sendPersonalChat':
        handleChatMessage(
          {
            senderSessionId: parsedMessage.senderSessionId ?? '',
            senderName: parsedMessage.senderName ?? '',
            receiverSessionId: parsedMessage.receiverSessionId ?? '',
            receiverName: parsedMessage.receiverName ?? '',
            message: parsedMessage.message ?? '',
          },
          true,
        );
        break;

      case 'broadcastChat':
        handleChatMessage(
          {
            senderSessionId: parsedMessage.senderSessionId ?? '',
            senderName: parsedMessage.senderName ?? '',
            receiverSessionId: parsedMessage.receiverSessionId ?? '',
            receiverName: parsedMessage.receiverName ?? '',
            message: parsedMessage.message ?? '',
          },
          false,
        );
        break;

      case 'audioStateChange':
        if (parsedMessage.sessionId) {
          peers.handleAudioStateChange({
            sessionId: parsedMessage.sessionId,
            audioOn: normalizeBoolean(parsedMessage.audioOn),
          });
        }
        break;

      case 'videoStateChange':
        if (parsedMessage.sessionId) {
          peers.handleVideoStateChange({
            sessionId: parsedMessage.sessionId,
            videoOn: normalizeBoolean(parsedMessage.videoOn),
          });
        }
        break;

      case 'sendPublicEmoji':
        handleEmojiMessage({
          senderSessionId: parsedMessage.senderSessionId ?? '',
          senderName: parsedMessage.senderName ?? '',
          receiverSessionId: parsedMessage.receiverSessionId,
          receiverName: parsedMessage.receiverName,
          emoji: parsedMessage.emoji ?? '',
        });
        break;

      case 'cancelHandRaise':
        if (parsedMessage.sessionId) {
          setRaisedHandSessionIds((prev) =>
            prev.filter((id) => id !== parsedMessage.sessionId),
          );
        }
        break;

      case 'changeName':
        if (parsedMessage.sessionId && parsedMessage.newUserName) {
          peers.handleUsernameChanged({
            sessionId: parsedMessage.sessionId,
            newUserName: parsedMessage.newUserName,
          });
        }
        break;

      case 'startRecording':
        void recording.startFromSocket(media.micOnRef.current, sendMessage);
        break;

      case 'stopRecording':
        recording.stopFromSocket();
        break;

      case 'pauseRecording':
        recording.pauseFromSocket();
        break;

      case 'resumeRecording':
        recording.resumeFromSocket();
        break;

      case 'requestRecordingPermission':
        setPendingSessionId(parsedMessage.sessionId ?? null);
        setRecordingPopupVisible(true);
        break;

      case 'grantRecordingPermission':
        setGranted(true);
        break;

      case 'denyRecordingPermission':
        setGranted(false);
        break;

      case 'confirmRecordingConsent':
        setRecordingConsentPopupVisible(true);
        break;

      default:
        console.error('Unrecognized message', parsedMessage);
    }
  };

  useEffect(() => {
    const ws = new WebSocket(wsServerUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify(connectMessage));
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as ServerMessage;
        socketHandlersRef.current(parsed);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    const handleBeforeUnload = () => {
      if (ws.readyState !== WebSocket.OPEN) return;

      if (userDataRef.current.sessionId) {
        ws.send(
          JSON.stringify({
            eventId: 'exitRoom',
            sessionId: userDataRef.current.sessionId,
          }),
        );
        return;
      }

      ws.send(
        JSON.stringify({
          eventId: 'exitRoom',
          username: name,
          roomId,
        }),
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      media.cleanupMedia();
      peers.cleanupPeers();
      ws.close();
      wsRef.current = null;
    };
  }, []);

  return (
    <Wrapper>
      <MainArea>
        <Header
          variant="compact"
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <GalleryWrapper>
          <ParticipantVideoGroup>
            {sortedSpeakerIds.map((sessionId, index) => {
              const participant = peers.participants[sessionId];
              if (!participant) return null;

              const isMain = index === 0;
              const volume = peers.participantVolumes[sessionId] ?? 50;

              return (
                <ParticipantVideo
                  key={participant.sessionId}
                  sessionId={participant.sessionId}
                  username={participant.username}
                  isVideoOn={participant.videoOn}
                  isAudioOn={participant.audioOn}
                  ref={videoRefs.current[sessionId]}
                  mySessionId={userData.sessionId}
                  emojiName={emojiMessages.find((msg) => msg.sessionId === sessionId)?.emoji}
                  onSpeakingScoreChange={(score) => handleSpeakingScoreChange(sessionId, score)}
                  className={isMain ? 'main-video' : 'sub-video'}
                  volume={volume}
                />
              );
            })}
          </ParticipantVideoGroup>

          {recording.recording && (
            <RecordingStatusPopup
              isPaused={recording.recordingPaused}
              elapsed={recording.elapsed}
              setElapsed={recording.setElapsed}
              onPause={() => sendMessage({ eventId: 'pauseRecording' })}
              onResume={() => sendMessage({ eventId: 'resumeRecording' })}
              onStop={() => sendMessage({ eventId: 'stopRecording' })}
            />
          )}
        </GalleryWrapper>

        <CallControls
          micOn={media.micOn}
          setMicOn={media.handleMicToggle}
          micListVisible={media.micListVisible}
          setMicListVisible={media.handleMicListToggle}
          videoOn={media.videoOn}
          setVideoOn={media.handleVideoToggle}
          videoListVisible={media.videoListVisible}
          setVideoListVisible={media.handleVideoListToggle}
          screenSharing={media.screenSharing}
          setScreenSharing={media.handleScreenSharingToggle}
          recording={recording.recording}
          recordingListVisible={recordingListVisible}
          setRecordingListVisible={() => setRecordingListVisible((prev) => !prev)}
          setRecording={handleRecordingToggle}
          captionsVisible={captionsVisible}
          setCaptionsVisible={() => setCaptionsVisible((prev) => !prev)}
          chatVisible={chatVisible}
          setChatVisible={() => setChatVisible((prev) => !prev)}
          participantsVisible={participantsVisible}
          setParticipantsVisible={() => setParticipantsVisible((prev) => !prev)}
          emotesVisible={emotesVisible}
          setEmotesVisible={() => setEmotesVisible((prev) => !prev)}
          onExit={exitRoom}
        />
      </MainArea>

      {changeNamePopupVisible && (
        <NameChangePopup
          currentName={userData.username}
          onChangeName={(newName) => {
            sendMessage({
              eventId: 'changeName',
              sessionId: userData.sessionId,
              newUserName: newName,
            });
          }}
          onClose={() => setChangeNamePopupVisible(false)}
        />
      )}

      <Sidebar
        participants={Object.values(peers.participants)}
        participantsVisible={participantsVisible}
        chatVisible={chatVisible}
        systemMessages={systemMessages}
        chatMessages={chatMessages}
        currentUserSessionId={userData.sessionId}
        onSendMessage={sendChatMessage}
        roomId={userData.roomId}
        roomLeaderSessionId={peers.roomLeader.sessionId}
        raisedHandSessionIds={raisedHandSessionIds}
        changeNamePopupVisible={changeNamePopupVisible}
        setChangeNamePopupVisible={setChangeNamePopupVisible}
        participantVolumes={peers.participantVolumes}
        onVolumeChange={(sessionId, newVolume) => {
          peers.setParticipantVolumes((prev) => ({
            ...prev,
            [sessionId]: newVolume,
          }));
        }}
      />

      {emotesVisible && (
        <EmojiPicker
          participants={Object.values(peers.participants)}
          currentUserSessionId={userData.sessionId}
          onClose={() => setEmotesVisible(false)}
          onSelect={(emojiName) => {

            if (emojiName === 'Lowering_Hands') {
                sendMessage({ eventId: 'cancelHandRaise' });
                return;
            }

            if (!topSpeaker?.id) {
                console.warn('수신자가 없습니다.');
                return;
            }

            if (topSpeaker.id === userData.sessionId) {
                return;
            }

            sendMessage({
                eventId: 'sendPublicEmoji',
                receiverSessionId: topSpeaker.id,
                emoji: emojiName,
            });
        }}
          hasSidebar={hasSidebar}
          handRaised={handRaised}
          setHandRaised={setHandRaised}
        />
      )}

      {recordingListVisible && (
        <ListPopup
          title="녹화본 다운로드"
          items={recording.recordedFiles}
          renderItem={(item) => (
            <span
              onClick={() => {
                const a = document.createElement('a');
                a.href = item.url;
                a.download = item.fileName;
                a.click();
                setRecordingListVisible(false);
              }}
              title="클릭해서 다운로드"
              style={{ cursor: 'pointer' }}
            >
              {item.fileName}
            </span>
          )}
          onClose={() => setRecordingListVisible(false)}
          hasSidebar={hasSidebar}
          popupLeft={45}
        />
      )}

      {recordingPopupVisible && (
        <RecordingPermissionPopup
          username={
            pendingSessionId
              ? peers.participants[pendingSessionId]?.username || '알 수 없는 사용자'
              : '알 수 없는 사용자'
          }
          onGrant={() => {
            sendMessage({
              eventId: 'grantRecordingPermission',
              sessionId: pendingSessionId,
            });
            setRecordingPopupVisible(false);
            setPendingSessionId(null);
          }}
          onDeny={() => {
            sendMessage({
              eventId: 'denyRecordingPermission',
              sessionId: pendingSessionId,
            });
            setRecordingPopupVisible(false);
            setPendingSessionId(null);
          }}
        />
      )}

      {recordingConsentPopupVisible && (
        <RecordingConsentPopup
          onConfirmConsent={() => {
            setRecordingConsentPopupVisible(false);
          }}
          onDeclineConsent={() => {
            setRecordingConsentPopupVisible(false);
            exitRoom();
          }}
        />
      )}

      {granted !== null && (
        <RecordingPermissionResultPopup
          granted={granted}
          onClose={() => setGranted(null)}
          onStartRecording={handleStartRecording}
        />
      )}

      {media.micListVisible && (
        <AudioInputSelector
          onDeviceChange={media.handleMicDeviceChange}
          selectedDeviceId={media.selectedMicId}
        />
      )}

      {media.videoListVisible && (
        <VideoInputSelector
          onDeviceChange={media.handleVideoDeviceChange}
          selectedDeviceId={media.selectedVideoId}
        />
      )}
    </Wrapper>
  );
};

export default Conference;