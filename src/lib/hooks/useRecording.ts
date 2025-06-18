import { useRef } from 'react';

interface UseRecordingOptions {
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export const useRecording = ({ onStop, onError }: UseRecordingOptions = {}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      // 1. 화면 공유 (디스플레이) 스트림
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // 일부 브라우저는 탭/시스템 오디오도 지원
      });

      // 2. 마이크 스트림
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. 화면 + 마이크 오디오 트랙 합치기
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...micStream.getAudioTracks(),
      ]);

      // 4. 녹화 시작
      const recorder = new MediaRecorder(combinedStream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        onStop?.(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      streamRef.current = combinedStream;
    } catch (err) {
      if (onError && err instanceof Error) onError(err);
      else alert('녹화를 시작할 수 없습니다.');
    }
  };

  const pause = () => {
    const r = mediaRecorderRef.current;
    if (r?.state === 'recording') r.pause();
  };

  const resume = () => {
    const r = mediaRecorderRef.current;
    if (r?.state === 'paused') r.resume();
  };

  const stop = () => {
    const r = mediaRecorderRef.current;
    if (!r) return;

    r.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    mediaRecorderRef.current = null;
    streamRef.current = null;
  };

  return { start, pause, resume, stop };
};
