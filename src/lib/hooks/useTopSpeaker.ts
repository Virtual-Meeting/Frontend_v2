//발화자 선정
//점수가 가장 높은 사람이 1 순위
//만약, 여러명이 점수가 같으면 1번으로 말한사람이 1순위
export function useTopSpeaker(scores: { [id: string]: number }) {
  return Object.entries(scores).reduce(
    (top, [id, score]) =>
      score > top.score ? { id, score } : top,
    { id: null, score: -1 }
  );
}
