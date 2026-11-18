import React, { useState } from 'react';
import twemoji from '@twemoji/api';
import confetti from 'canvas-confetti';

const TWEMOJI_SVG_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/svg';

// Matches standard emoji sequences including variation selectors and ZWJ pairs
const EMOJI_REGEX =
  /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;

interface EmojiProps {
  char: string;
  size?: number;
  className?: string;
  label?: string;
}

export const Emoji: React.FC<EmojiProps> = ({
  char,
  size = 24,
  className = '',
  label,
}) => {
  const [failed, setFailed] = useState(false);

  // Strip variation selector FE0F for Twemoji SVG filename consistency
  const cleanForCodepoint = char.replace(/\uFE0F/g, '');
  const codePoint = twemoji.convert.toCodePoint(cleanForCodepoint);

  if (failed || !codePoint) {
    return (
      <span
        role={label ? 'img' : undefined}
        aria-label={label || char}
        className={`inline-flex items-center justify-center leading-none align-middle ${className}`}
        style={{ fontSize: `${size}px` }}
      >
        {char}
      </span>
    );
  }

  return (
    <img
      src={`${TWEMOJI_SVG_BASE}/${codePoint}.svg`}
      alt={label || char}
      draggable={false}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`inline-block align-middle select-none shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

interface EmojiTextProps {
  text: string;
  emojiSize?: number;
  className?: string;
}

export const EmojiText: React.FC<EmojiTextProps> = ({
  text,
  emojiSize = 22,
  className = '',
}) => {
  if (!text) return null;
  const parts = text.split(EMOJI_REGEX);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (EMOJI_REGEX.test(part)) {
          EMOJI_REGEX.lastIndex = 0;
          return <Emoji key={idx} char={part} size={emojiSize} className="mx-0.5 -mt-0.5" />;
        }
        EMOJI_REGEX.lastIndex = 0;
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export function fireComicCelebration(emojis: string[] = ['🚀', '⭐', '💥', '⚡', '🎉']) {
  try {
    confetti({
      particleCount: 48,
      spread: 75,
      origin: { y: 0.62 },
      colors: ['#FFD600', '#FF2A85', '#00E5FF', '#00E676', '#FF9100'],
      disableForReducedMotion: true,
    });

    if (typeof confetti.shapeFromText === 'function') {
      const shapes = emojis.map((em) =>
        confetti.shapeFromText({ text: em, scalar: 2 })
      );
      confetti({
        particleCount: 14,
        spread: 65,
        scalar: 1.8,
        origin: { y: 0.58 },
        shapes,
        disableForReducedMotion: true,
      });
    }
  } catch {
    // Ignore confetti failures in restricted headless canvas contexts
  }
}
