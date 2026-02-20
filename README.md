# 🖥 VMO [ Vision + Motion / Emoji ] 
본 프로젝트는 **WebRTC 기반 실시간 화상 커뮤니케이션 플랫폼**으로 <br/>**비언어적 표현**을 강화하여 온라인 회의의 **몰입도**와 **상호작용**을 향상시키는 것을 목표로 합니다.


<img src="https://github.com/user-attachments/assets/6ae75431-5943-44d2-9733-6e74dedcbf3e"/>

  
<br/>

<br/>

### 🎥 데모 영상


<a href="https://youtu.be/bu5gQc6qs1c" target="_blank">
  <img width="400" alt="Demo Video"
       src="https://github.com/user-attachments/assets/129e6019-321b-4504-8997-8c343c6ffe31" />
</a>


<br/>

<br/>
 
| 내용 | 주소 |
| -- | -- |
|🌐 **Frontend Preview**|https://front-v2-develop-test.vercel.app/|
|🔗 **Backend Repository**|https://github.com/Virtual-Meeting/Backend_v2.git|


> 실시간 기능은 **Backend** 및 **Kurento Media Server**와 함께 실행됩니다.  
> 현재 **백엔드 서버는 운영하지 않고** 있으며, **로컬 환경에서 정상 동작을 확인**할 수 있습니다.




<br/>

## 👩🏻‍🤝‍👩🏻 프로젝트 기간/팀원
2인 팀 프로젝트 (2025.01 ~ 2025.06, 약 6개월)


| 박지유 (Frontend) | 이민정 (Backend) |
| -- | -- |
|WebRTC 클라이언트 구현 및 웹 UI 개발|Signaling 서버 및 Media Server 연동|


<br/>

## 🧠 프로젝트 배경

기존 화상회의에서는 발화자가 **참여자의 반응**이나 **의도**를 **즉각적으로 인지하기 어렵다**는 한계가 있습니다.  

**VMO**는 **WebRTC 기반 통신 구조** 위에 실시간 **이모지 반응** 기능을 결합하여 참여자의 피드백을 발화자에게 **즉각적으로 전달**하도록 설계했습니다.

<br/>


## 🎉 주요 기능

| 기능 | 설명 | 데모 |
|------|------|------|
| 🎭 실시간 이모지 반응 | WebSocket 기반 이벤트 동기화를 통해 참여자의 반응을 발화자에게 전달 | <img src="https://github.com/user-attachments/assets/03ad7264-c868-4144-b2be-adc3408e0278" width="300"/> |
| ✋ 손들기/손내리기 | 발언 상태를 이벤트로 전송하여 참가자목록에 표시 | <img src="https://github.com/user-attachments/assets/ba44c2d3-1b06-4da0-9ab7-b25696cda9ef" width="300"/> |
| 🖥 화면 공유 | WebRTC replaceTrack을 활용한 동적 트랙 전환 | <img src="https://github.com/user-attachments/assets/5f179426-c498-4a67-ac5f-12e64f26e4a3" width="300"/> |
| 🎥 회의 녹화 | MediaRecorder API 기반 클라이언트 녹화 및 다운로드 | <img src="https://github.com/user-attachments/assets/b3cb2838-116b-48d3-8a74-83528ae8cec8" width="300"/> |
| 💬 실시간 채팅 (전체 / 개인) | WebSocket 기반 메시지 전송 및 브로드캐스트 처리 | <img src="https://github.com/user-attachments/assets/b4149078-3c99-49cd-b18e-60c1e56e3da3" width="300"/> |


<br/>

## 🏗 시스템 아키텍처

<img width="5342" height="2135" alt="vmo아키텍처" src="https://github.com/user-attachments/assets/ff634362-381b-4d20-8749-cd4d602b03ea" />


<br/>

## 🙋 My Role (Frontend)

- **WebRTC 연결 및 세션 관리**
  - WebSocket Signaling 기반 연결 수립
  - WebRtcPeer 생성 및 SDP/ICE 처리

- **미디어 제어 및 트랙 교체**
  - Mic/Camera 상태 동기화
  - `RTCRtpSender.replaceTrack()` 기반 화면 공유 및 디바이스 변경 구현

- **녹화 및 미디어 처리**
  - MediaRecorder API 기반 클라이언트 녹화
  - WebM duration 보정 처리

- **발화 감지(VAD) 구현**
  - Web Audio API 기반 발화 감지 및 발화자 우선 정렬

- **UI 및 상호작용 기능**
  - 대기실(장치 선택/이름 입력)
  - 채팅, 이모지, 손들기 기능 구현

<br/>

## 🐛 Troubleshooting

- **ICE Candidate 선도착 문제**
  - rtcPeer 준비 전 candidate 도착 → 가드 로직 추가

- **화면 공유 종료 후 카메라 복귀 실패**
  - 이전 트랙 복원 및 displayStream 정리(stop)

- **디바이스 변경 시 로컬 프리뷰 미동기화**
  - MediaStream 재구성 후 `srcObject` 재할당

- **MediaRecorder WebM duration 오류**
  - 종료 시 duration 보정 적용

- **VAD 리소스 누수**
  - interval 및 AudioContext cleanup 처리

    
<br/>

## 🛠 기술 스택

#### 프론트엔드

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-v7-CA4245?logo=reactrouter&logoColor=white)
![styled--components](https://img.shields.io/badge/styled--components-DB7093?logo=styledcomponents&logoColor=white)


#### 실시간 통신 / 미디어

![WebRTC](https://img.shields.io/badge/WebRTC-333333?logo=webrtc&logoColor=white)
![Kurento](https://img.shields.io/badge/Kurento%20Utils-0A66C2?logo=webrtc&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?logo=socketdotio&logoColor=white)
![MediaRecorder](https://img.shields.io/badge/MediaRecorder%20API-FF6F00?logo=googlechrome&logoColor=white)
![Web%20Audio%20API](https://img.shields.io/badge/Web%20Audio%20API-4285F4?logo=googlechrome&logoColor=white)

<br/>

## 🚀 실행 방법

Node.js 18 이상

```bash
npm install
npm start
