###### 해당 Repository는 VMO 프로젝트의 Frontend입니다.

---
# 🖥 VMO [ Vision + Motion / Emoji ] 
비언어적 반응(이모지)을 실시간으로 공유해 상호작용을 강화한 **WebRTC 화상 커뮤니케이션 플랫폼**으로 본 프로젝트는 **2인 팀 프로젝트**로 제작되었습니다.



### 🎥 데모 영상
TODO

<br/>

 
| 내용 | 주소 |
| -- | -- |
|🔗 프론트 배포|https://front-v2-develop-test.vercel.app/|
|🔗 백엔드 레포|https://github.com/Virtual-Meeting/Backend_v2.git|

※ 현재는 **Frontend 단독 배포 상태**이며, WebRTC 관련 기능은 로컬 환경(Front + Back + Kurento)에서만 정상 동작합니다.




<br/>

## 📝 프로젝트 개요
VMO는 회의 중 표정/제스처를 대신할 **실시간 이모지 반응**을 제공해, 온라인 회의의 몰입도와 참여도를 높이는 것을 목표로 합니다.
VMO는 온라인 회의에서 부족한 비언어적 표현(표정·제스처·반응)을 보완하기 위해
실시간 이모지 반응 시스템을 도입한 WebRTC 기반 커뮤니케이션 플랫폼입니다.

<br/>

### 🎉 주요 기능

- **이모지 애니메이션**을 통해 **실시간 감정 표현/반응** 전달 (ex: 😍, ✋ 등)
- **회의 녹화 기능** (방장: 전체 회의 녹화, 참가자: 방장 승인 하에 녹화 가능)
- 발표자/참가자 간 **화면 공유**
- 실시간 화상 회의 중 **텍스트로 커뮤니케이션** 가능


<br/>

## 👩🏻‍🤝‍👩🏻 프로젝트 기간/팀원
> 2024.12 ~ 2025.06


| 박지유 | 이민정 |
| -- | -- |
|Frontend|Backend|

<br/>

## 🛠 기술 스택
React 19 · TypeScript · React Router v7 · styled-components · WebRTC · Kurento Utils · WebSocket · MediaRecorder · Web Audio API

### Frontend
- React (v19)
- TypeScript
- React Router DOM (v7)
- styled-components (v6)

### Realtime / Media
- WebRTC (getUserMedia / RTCPeerConnection)
- Kurento Utils (WebRtcPeer 기반 송수신)
- WebSocket Signaling (room/SDP/ICE 이벤트 처리)
- Screen Sharing (getDisplayMedia + replaceTrack)
- Recording (MediaRecorder + webm-duration-fix)
- Voice Activity Detection (Web Audio API: AudioContext/Analyser)

### Testing / Quality
- Jest (react-scripts)
- React Testing Library (@testing-library/*)

### Build / Tooling
- Create React App (react-scripts)
- ESLint (CRA preset)
- TS Path Alias (assets/*, components/*, pages/*, lib/*, types/*)

<br/>

## 💡 핵심 기능
- 실시간 화상 회의 (WebRTC, Kurento 기반)
- 동적 이모지 리액션(애니메이션)
- 화면 공유
- 실시간 채팅
- 녹화 제어 UI (실제 녹화 처리/권한은 Backend 의존)



