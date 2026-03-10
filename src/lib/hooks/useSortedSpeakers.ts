import { useState, useEffect } from 'react';

interface SpeakerScores {
  [sessionId: string]: number;
}

interface FirstSpokenTimestamps {
  [sessionId: string]: number;}



export function useSortedSpeakers(
  scores: SpeakerScores,
  timestamps: FirstSpokenTimestamps
): string[] {
  const [prevOrder, setPrevOrder] = useState<string[]>([]);

  useEffect(() => {
    const newOrder = Object.entries(scores)
      .sort(([idA, scoreA], [idB, scoreB]) => {
        const timeA = timestamps[idA] ?? Infinity;
        const timeB = timestamps[idB] ?? Infinity;

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        if (scoreA === 0 && scoreB === 0) {
          const indexA = prevOrder.indexOf(idA);
          const indexB = prevOrder.indexOf(idB);
          if (indexA === -1 || indexB === -1) {
            return timeB - timeA;
          }
          return indexA - indexB;
        }

        return timeA - timeB;
      })
      .map(([id]) => id);

    setPrevOrder(newOrder);
  }, [scores, timestamps]);

  return prevOrder;
}
