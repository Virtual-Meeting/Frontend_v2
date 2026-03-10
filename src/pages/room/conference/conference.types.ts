import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import type Participant from 'lib/webrtc/Participant';

export type UserData = {
  sessionId: string;
  username: string;
  roomId: string;
  audioOn: boolean;
  videoOn: boolean;
};

export type ParsedParticipant = {
  sessionId: string;
  username: string;
  audioOn: boolean;
  videoOn: boolean;
};

export type RoomLeader = {
  sessionId: string;
  username: string;
};

export type RecordedFile = {
  url: string;
  fileName: string;
  duration: number;
};

export type SystemMessage = {
  content: string;
  timestamp: number;
};

export type ParticipantMap = Record<string, Participant>;
export type ParticipantsRef = MutableRefObject<ParticipantMap>;

export type VideoRefMap = Record<string, RefObject<HTMLVideoElement>>;
export type VideoRefsRef = MutableRefObject<VideoRefMap>;

export type LocalStreamRef = MutableRefObject<MediaStream | null>;
export type UserDataRef = MutableRefObject<UserData>;
export type UserDataSetter = Dispatch<SetStateAction<UserData>>;

export type ClientMessage =
  | { eventId: 'joinRoom'; username: string; roomId: string; audioOn: boolean; videoOn: boolean }
  | { eventId: 'createRoom'; username: string; audioOn: boolean; videoOn: boolean }
  | { eventId: 'exitRoom'; sessionId?: string; username?: string; roomId?: string }
  | { eventId: 'audioStateChange'; sessionId: string; audioOn: boolean }
  | { eventId: 'videoStateChange'; sessionId: string; videoOn: boolean }
  | { eventId: 'receiveVideoAnswer'; sessionId: string; sdpOffer: string }
  | { eventId: 'onIceCandidate'; sessionId: string; candidate: RTCIceCandidateInit }
  | { eventId: 'broadcastChat'; message: string }
  | { eventId: 'sendPersonalChat'; receiverSessionId: string; message: string }
  | { eventId: 'sendPublicEmoji'; receiverSessionId: string; emoji: string }
  | { eventId: 'cancelHandRaise' }
  | { eventId: 'changeName'; sessionId: string; newUserName: string }
  | { eventId: 'requestRecordingPermission' }
  | { eventId: 'grantRecordingPermission'; sessionId: string | null }
  | { eventId: 'denyRecordingPermission'; sessionId: string | null }
  | { eventId: 'startRecording' }
  | { eventId: 'stopRecording' }
  | { eventId: 'pauseRecording' }
  | { eventId: 'resumeRecording' }
  | { eventId: 'confirmRecordingConsent' };

export type ServerMessage = {
  action?: string;
  type?: string;
  message?: string;

  sessionId?: string;
  username?: string;
  roomId?: string;

  roomLeaderId?: string;
  roomLeaderName?: string;
  roomLeadername?: string;

  participants?: unknown[];

  audioOn?: boolean | string;
  videoOn?: boolean | string;

  candidate?: RTCIceCandidateInit;
  sdpAnswer?: string;

  senderSessionId?: string;
  senderName?: string;
  receiverSessionId?: string;
  receiverName?: string;
  emoji?: string;

  newUserName?: string;
};

export const normalizeBoolean = (value: boolean | string | undefined): boolean =>
  typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;