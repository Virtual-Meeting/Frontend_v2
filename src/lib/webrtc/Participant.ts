type SendMessageFunc = (message: Record<string, unknown>) => void;

export default class Participant {
  sessionId: string;
  username: string;
  videoOn: boolean;
  audioOn: boolean;
  rtcPeer: any;
  sendMessage: SendMessageFunc;

  constructor(
    sessionId: string,
    username: string,
    sendMessage: SendMessageFunc,
    videoOn: boolean | string,
    audioOn: boolean | string,
  ) {
    this.sessionId = sessionId;
    this.username = username;
    this.sendMessage = sendMessage;
    this.videoOn = this.convertToBoolean(videoOn);
    this.audioOn = this.convertToBoolean(audioOn);
    this.rtcPeer = null;
  }

  private convertToBoolean(value: string | boolean): boolean {
    return typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;
  }

  offerToReceiveVideo = (error: unknown, offerSdp: string) => {
    if (error) {
      console.error('SDP offer error:', error);
      return;
    }

    this.sendMessage({
      eventId: 'receiveVideoAnswer',
      sessionId: this.sessionId,
      sdpOffer: offerSdp,
    });
  };

  onIceCandidate = (candidate: RTCIceCandidateInit) => {
    this.sendMessage({
      eventId: 'onIceCandidate',
      sessionId: this.sessionId,
      candidate,
    });
  };

  dispose = () => {
    try {
      if (this.rtcPeer) {
        this.rtcPeer.dispose();
      }
    } catch (error) {
      console.warn('rtcPeer dispose error:', error);
    } finally {
      this.rtcPeer = null;
    }
  };
}