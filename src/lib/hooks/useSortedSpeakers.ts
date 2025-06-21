import { useMemo } from 'react';

interface SpeakerScores {
  [sessionId: string]: number;
}

interface FirstSpokenTimestamps {
  [sessionId: string]: number;
}

export function useSortedSpeakers(
  scores: SpeakerScores,
  timestamps: FirstSpokenTimestamps
): string[] {
  return useMemo(() => {
    return Object.entries(scores)
      .sort(([idA, scoreA], [idB, scoreB]) => {
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // 점수 내림차순
        }

        const timeA = timestamps[idA] ?? Infinity;
        const timeB = timestamps[idB] ?? Infinity;
        return timeA - timeB; // 동점일 경우 먼저 말한 사람
      })
      .map(([id]) => id);
  }, [scores, timestamps]);
}
