import React, { useEffect, useRef, useState } from 'react';
import * as kurentoUtils from 'kurento-utils';
import Header from 'components/common/Header';
import Participant from 'lib/webrtc/Participant';
import ParticipantVideo from 'components/common/Video/ParticipantVideo';
import CallControls from 'components/common/CallControls';
import { Wrapper, GalleryWrapper } from './Conference.styles';

type ConferenceProps = {
  name: string;
  roomId: string;
};

// User data 타입 정의
interface UserData {
    sessionId: string;
    username: string;
    roomId: string;
    audioOn: boolean;
    videoOn: boolean;
}

const wsServerUrl = 'ws://localhost:8080';

const Conference: React.FC<ConferenceProps> = ({ name, roomId }) => {

    //CallControls에서 받는 값
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);

    const [participantsVisible, setParticipantsVisible] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [captionsVisible, setCaptionsVisible] = useState(false);
    const [emotesVisible, setEmotesVisible] = useState(false);

    // 상태 변경을 위한 핸들러 함수들
    const handleMicToggle = () => setMicOn((prev) => !prev);
    const handleVideoToggle = () => setVideoOn((prev) => !prev);
    const handleScreenSharingToggle = () => setScreenSharing((prev) => !prev);
    const handleRecordingToggle = () => setRecording((prev) => !prev);
    const handleCaptionsToggle = () => setCaptionsVisible((prev) => !prev);
    const handleChatToggle = () => setChatVisible((prev) => !prev);
    const handleParticipantsToggle = () => setParticipantsVisible((prev) => !prev);
    const handleEmotesToggle = () => setEmotesVisible((prev) => !prev);

    const isJoin = roomId.trim().length > 0;
    const ws = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const videoRefs = useRef<{ [sessionId: string]: React.RefObject<HTMLVideoElement> }>({});

    const [participants, setParticipants] = useState<{ [sessionId: string]: Participant }>({});
    const participantsRef = useRef<{ [sessionId: string]: Participant }>({});

    const [userData, setUserData] = useState<UserData>({
        sessionId: '',
        username: name,
        roomId: roomId,
        audioOn: true,
        videoOn: true,
    });

    useEffect(()=>{
        ws.current = new WebSocket(wsServerUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connection opened.');

            const message = isJoin ? {
                eventId: 'joinRoom',
                username: name,
                roomId: roomId,
                audioOn: true,     // 오디오 상태 값
                videoOn: true,     // 비디오 상태 값
            }:{
                eventId: 'createRoom',
                username: name,
                audioOn: true,
                videoOn: true,
            }

            ws.current.send(JSON.stringify(message));
        };

        ws.current.onmessage = (message) => {
            let parsedMessage = JSON.parse(message.data);
            console.info('Received message: ' + message.data);

            switch (parsedMessage.action) {
                case 'roomCreated':
                    roomCreated(parsedMessage);
                    break;
                case 'sendExistingUsers':
                    sendExistingUsers(parsedMessage);
                    break;
                case 'newUserJoined':
                    newUserJoined(parsedMessage);
                    break;
                case 'onIceCandidate': //사용자 peer연결
                    onIceCandidate(parsedMessage);
                    break;
                case 'receiveVideoFrom': //비디오 연결
                    receiveVideoResponse(parsedMessage);
                    break;
                case 'exitRoom':
                    userLeft(parsedMessage);
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        }

        return () => {
            if(ws.current){
                console.log("Closing WebSocket connection.");
                ws.current.close();  // 웹소켓 연결 종료
            }
        }
    },[]);

    useEffect(()=>{
        console.log("userData:",userData);
    },[userData]);

    const sendMessage = (message) => {
        let jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + jsonMessage);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(jsonMessage);
        }
    }
    
    const roomCreated = (response:{ sessionId: string; username: string; roomId: string; }) => {
        console.log('Room created response:', response);

        // 서버에서 받은 응답에 맞게 유저 데이터를 업데이트
        setUserData((prevData) => ({
            ...prevData,
            sessionId: response.sessionId,
            roomId: response.roomId, // 방 ID 업데이트
        }));

        sendExistingUsers(response);
    }

    const receiveVideo = (sender) => {
        let participant = participantsRef.current[sender.sessionId];

        if (!participant) {
            participant = new Participant(sender.sessionId, sender.username, sendMessage, sender.videoOn, sender.audioOn);

            // 비디오 ref 등록
            if (!videoRefs.current[sender.sessionId]) {
                videoRefs.current[sender.sessionId] = React.createRef<HTMLVideoElement>();
            }

            participantsRef.current[sender.sessionId] = participant;
            setParticipants(prev => ({
                ...prev,
                [sender.sessionId]: participant
            }));
        }

        // 💡 렌더링 이후까지 기다렸다가 비디오 연결 시도
        setTimeout(() => {
            const videoElement = videoRefs.current[sender.sessionId]?.current;

            if (!videoElement) {
                console.warn("❗ 비디오 요소가 아직 준비되지 않았습니다:", sender.sessionId);
                return;
            }

            const options = {
                remoteVideo: videoElement,
                onicecandidate: participant.onIceCandidate.bind(participant),
            };

            participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                if (error) {
                    console.error("WebRtcPeerRecvonly 생성 실패:", error);
                    return;
                }

                this.generateOffer(participant.offerToReceiveVideo.bind(participant));
            });
        }, 100); // 💡 100ms 정도의 짧은 지연
    };


    const newUserJoined = (msg) => {
        receiveVideo(msg);
    }

    const sendExistingUsers = (msg) => {
        const participant = new Participant(msg.sessionId, msg.username,sendMessage, msg.videoOn, msg.audioOn);
        participantsRef.current[msg.sessionId] = participant;
        setParticipants(prev => ({
            ...prev,
            [msg.sessionId]: participant
        }));

        if (!videoRefs.current[msg.sessionId]) {
            videoRefs.current[msg.sessionId] = React.createRef<HTMLVideoElement>();
        }

        const localVideoRef = videoRefs.current[msg.sessionId];

        // getUserMedia → WebRTC 연결
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                 // 스트림 전역에 저장
                localStreamRef.current = stream;

                // 현재 오디오/비디오 상태 반영
                stream.getAudioTracks().forEach(track => (track.enabled = micOn));
                stream.getVideoTracks().forEach(track => (track.enabled = videoOn));

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                const options = {
                    localVideo: stream,
                    mediaConstraints: { audio: true, video: true },
                    onicecandidate: participant.onIceCandidate.bind(participant),
                };

                participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error: any) {
                    if (error) {
                        return console.error("WebRtcPeerSendonly 생성 오류:", error);
                    }

                    this.peerConnection.addEventListener("iceconnectionstatechange", () => {
                        console.log(`ICE 상태: ${this.peerConnection.iceConnectionState}`);
                    });

                    this.generateOffer(participant.offerToReceiveVideo.bind(participant));
                });
                // 기존 참가자 목록 처리
                if (msg.participants && Array.isArray(msg.participants)) {
                    msg.participants.forEach((existingParticipantInfo) => {
                        // 기존 참가자 처리
                        const existingParticipant = parseParticipant(existingParticipantInfo);

                        // 기존 참가자에게 비디오 수신 설정
                        receiveVideo(existingParticipant);
                    });
                }
            })
            .catch((error) => {
                console.error("로컬 미디어 접근 오류:", error);
            });        
    }

    const parseParticipant = (participantInfo) => {
        // participantInfo가 문자열이면 JSON 파싱 시도
        if (typeof participantInfo === 'string') {
            try {
                const parsed = JSON.parse(participantInfo);
                return {
                    sessionId: parsed.sessionId,
                    username: parsed.username,
                    audioOn: parsed.audioOn === "true",
                    videoOn: parsed.videoOn === "true"
                };
            } catch (e) {
                console.error("❌ 문자열 파싱 실패:", participantInfo, e);
                return null;
            }
        }
    
        // 이미 객체이면 그대로 필드 꺼내기
        return {
            sessionId: participantInfo.sessionId,
            username: participantInfo.username,
            audioOn: typeof participantInfo.audioOn === 'string' ? participantInfo.audioOn === "true" : !!participantInfo.audioOn,
            videoOn: typeof participantInfo.videoOn === 'string' ? participantInfo.videoOn === "true" : !!participantInfo.videoOn
        };
    };

    const receiveVideoResponse = (result: { sessionId: string; sdpAnswer: string }) => {
        // 참가자가 존재하는지 확인
        let participant = participantsRef.current[result.sessionId]

        if (!participant) {
            console.error(`Participant with sessionId ${result.sessionId} not found.`);
            return;
        }

        // rtcPeer가 없으면 새로운 rtcPeer를 생성해야 함
        if (!participant.rtcPeer) {
            console.error(`rtcPeer for participant ${result.sessionId} is not initialized.`);
            return;
        }

        // processAnswer 호출
        participant.rtcPeer.processAnswer(result.sdpAnswer, function (error: any) {
            if (error) {
                console.error('Error processing SDP answer:', error);
                return;
            }
            console.log('SDP answer processed successfully');
        });
    };


    const onIceCandidate = (message: any) => {
        const { sessionId, candidate } = message;
        const participant = participantsRef.current[sessionId];

        // 1. 참가자가 존재하는지 확인
        if (!participant) {
            console.error(`Participant with sessionId ${sessionId} does not exist.`);
            return;
        }

        // 2. rtcPeer가 생성되지 않았다면, 초기화가 필요
        if (!participant.rtcPeer) {
            console.error(`rtcPeer is not initialized for participant ${sessionId}`);
            return;
        }

        // 3. ICE 후보를 rtcPeer에 추가
        const iceCandidate = new RTCIceCandidate(candidate);
        participant.rtcPeer.addIceCandidate(iceCandidate, (error) => {
            if (error) {
                console.error('Failed to add ICE candidate:', error);
            } else {
                console.log('ICE candidate added for participant:', sessionId);
            }
        });
    };

    const exitRoom = () => {
        const message = {
            eventId: 'exitRoom',
            sessionId: userData.sessionId
        };
        
        sendMessage(message);
    }

    const userLeft = (request: { sessionId: string }) => {
        const participant = participantsRef.current[request.sessionId];

        if (!participant) {
            console.warn("해당 sessionId의 참가자가 없습니다:", request.sessionId);
            return;
        }

        // WebRTC 리소스 정리
        participant.dispose();

        // 상태에서 제거
        setParticipants(prev => {
            const updated = { ...prev };
            delete updated[request.sessionId];
            return updated;
        });

        delete participantsRef.current[request.sessionId];

        // videoRefs도 정리
        delete videoRefs.current[request.sessionId];
    };

    
    // 참가자 상태가 변경될 때마다 UI에 반영
    useEffect(() => {
        // 참가자가 추가되었을 때 화면에 비디오 업데이트
        console.log('Participants updated:', participants);
    }, [participants]);

    // 마이크 상태 변경 시 오디오 트랙에 반영
    useEffect(() => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = micOn;
                console.log(`🎤 마이크 상태 변경: ${micOn}`);
            });
        }
    }, [micOn]);

    // 비디오 상태 변경 시 비디오 트랙에 반영
    useEffect(() => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = videoOn;
                console.log(`📹 비디오 상태 변경: ${videoOn}`);
            });
        }
    }, [videoOn]);


    return (
    <Wrapper>
        <Header variant="compact" />
        <GalleryWrapper>
            {Object.values(participants).map((participant) => (
                <ParticipantVideo isVideoOn={participant.videoOn} isAudioOn={participant.audioOn} key={participant.sessionId} sessionId={participant.sessionId} username={participant.username}  ref={videoRefs.current[participant.sessionId]}/>
            ))}
        </GalleryWrapper>
        <CallControls
            micOn={micOn}
            setMicOn={handleMicToggle}
            videoOn={videoOn}
            setVideoOn={handleVideoToggle}
            screenSharing={screenSharing}
            setScreenSharing={handleScreenSharingToggle}
            recording={recording}
            setRecording={handleRecordingToggle}
            captionsVisible={captionsVisible}
            setCaptionsVisible={handleCaptionsToggle}
            chatVisible={chatVisible}
            setChatVisible={handleChatToggle}
            participantsVisible={participantsVisible}
            setParticipantsVisible={handleParticipantsToggle}
            emotesVisible={emotesVisible}
            setEmotesVisible={handleEmotesToggle}
            onExit={exitRoom}
        />
    </Wrapper>
    );
};

export default Conference;
