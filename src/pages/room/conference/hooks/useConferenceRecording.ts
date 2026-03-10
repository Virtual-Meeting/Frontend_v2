import { useEffect, useRef, useState } from 'react';
import fixWebmDuration from 'webm-duration-fix';
import { useRecording } from 'lib/hooks/useRecording';
import type { ClientMessage, RecordedFile } from '../conference.types';

export function useConferenceRecording() {
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordedFiles, setRecordedFiles] = useState<RecordedFile[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const elapsedRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const getFileName = () => {
    const now = new Date();
    return `recording_${now.toISOString().replace(/[:.]/g, '-')}.webm`;
  };

  const { start, stop, pause, resume, setMicEnabled } = useRecording({
    onStop: async (blob) => {
      const fixedBlob = await fixWebmDuration(blob);
      const url = URL.createObjectURL(fixedBlob);
      objectUrlsRef.current.push(url);

      setRecordedFiles((prev) => [
        ...prev,
        {
          url,
          fileName: getFileName(),
          duration: elapsedRef.current,
        },
      ]);

      setElapsed(0);
    },
  });

  const startFromSocket = async (
    micEnabled: boolean,
    sendMessage: (message: ClientMessage) => void,
  ) => {
    try {
      await start(micEnabled);
      setRecording(true);
      setRecordingPaused(false);
      sendMessage({ eventId: 'confirmRecordingConsent' });
    } catch (error) {
      console.error('녹화 시작 실패:', error);
      sendMessage({ eventId: 'stopRecording' });
    }
  };

  const stopFromSocket = () => {
    stop();
    setRecording(false);
    setRecordingPaused(false);
  };

  const pauseFromSocket = () => {
    pause();
    setRecordingPaused(true);
  };

  const resumeFromSocket = () => {
    resume();
    setRecordingPaused(false);
  };

  return {
    recording,
    recordingPaused,
    recordedFiles,
    elapsed,
    setElapsed,
    setMicEnabled,
    startFromSocket,
    stopFromSocket,
    pauseFromSocket,
    resumeFromSocket,
  };
}