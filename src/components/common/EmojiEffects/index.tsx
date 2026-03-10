import React, { useEffect, useState } from 'react';
import { EmojiOverlay, EmojiParticle } from './EmojiEffects.styles';
import emojiList from '../EmojiPicker/emojiList';

interface Particle {
  id: number;
  name: string;
  left: number;
  delay: number;
}

type Props = {
  emojiName?: string;
  maxCount?: number;
};

const EmojiEffects: React.FC<Props> = ({ emojiName, maxCount = 10 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!emojiName) return;

    const count = Math.floor(Math.random() * maxCount) + 4;

    let timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < count; i++) {
      const appearDelay = Math.random() * 0.4 + 0.1;

      const timeout = setTimeout(() => {
        const id = Date.now() + Math.random();
        const left = Math.random() * 80 + 10;

        const newParticle: Particle = {
          id,
          name: emojiName,
          left,
          delay: 0,
        };

        setParticles((prev) => [...prev, newParticle]);

        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== id));
        }, 1200);
      }, appearDelay * 1000 * i);

      timeouts.push(timeout);
    }

    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [emojiName, maxCount]);

  return (
    <EmojiOverlay>
      {particles.map(({ id, name, left, delay }) => {
        const match = emojiList.find((e) => e.name === name);
        if (!match) return null;

        const EmojiComp = match.Component;
        return (
          <EmojiParticle key={id} left={left} delay={delay}>
            <EmojiComp />
          </EmojiParticle>
        );
      })}
    </EmojiOverlay>
  );
};

export default EmojiEffects;
