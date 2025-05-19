import React, { useEffect, useRef, useState } from 'react';
import * as kurentoUtils from 'kurento-utils';
import Header from 'components/common/Header';
import Participant from 'lib/webrtc/Participant';
import ParticipantVideo from 'components/common/Video/ParticipantVideo';
import Button from 'components/common/Button';

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
    const isJoin = roomId.trim().length > 0;
    const ws = useRef<WebSocket | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
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
        if(!participant) {
            participant = new Participant(sender.sessionId, sender.username,sendMessage, sender.videoOn, sender.audioOn)
            // 참가자 추가 상태 업데이트
        setParticipants((prevParticipants) => ({
        ...prevParticipants,
        [sender.sessionId]: participant,
        }));

        participantsRef.current[sender.sessionId] = participant;
        }

        if (!videoRefs.current[sender.sessionId]) {
            videoRefs.current[sender.sessionId] = React.createRef<HTMLVideoElement>();
        }
        const videoRef = videoRefs.current[sender.sessionId];
        

        if (!participant.rtcPeer) {
        let options = {
            remoteVideo: videoRef.current,
            onicecandidate: participant.onIceCandidate.bind(participant),
        };

        participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
            if (error) {
                return console.error(error);
            }
            this.generateOffer(participant.offerToReceiveVideo.bind(participant)); 
        });
    }     
    }

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
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                const options = {
                    localVideo: localVideoRef.current!,
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
            })
            .catch((error) => {
                console.error("로컬 미디어 접근 오류:", error);
            });

        // 기존 참가자 목록 처리
        if (msg.participants && Array.isArray(msg.participants)) {
            msg.participants.forEach((participantStr: string) => {
                try {
                const parsed = JSON.parse(participantStr);
                // 문자열인 audioOn/videoOn을 boolean으로 변환
                parsed.audioOn = parsed.audioOn === 'true';
                parsed.videoOn = parsed.videoOn === 'true';

                    receiveVideo(parsed);
                } catch (err) {
                    console.error("❌ 참가자 파싱 오류:", err, participantStr);
                }
            });
            }
    }

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
    
    return (
    <div>
        <Header variant="compact" />
        {Object.values(participants).map((participant) => (
            <ParticipantVideo key={participant.sessionId} sessionId={participant.sessionId} username={participant.username}  ref={videoRefs.current[participant.sessionId]}/>
        ))}
        <Button onClick={exitRoom}>방 나가기</Button>
    </div>
    );
};

export default Conference;
