import React from 'react';
import type { RuntimeCard } from '../types';
import { CARD_HEIGHT, CARD_WIDTH, GRID_SIZE } from '../constants';

interface CardProps {
  card: RuntimeCard;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const handleClick = () => {
    if (!card.isClickable) return;
    onClick?.();
  };

  const leftPx = card.x * GRID_SIZE;
  const topPx = card.y * GRID_SIZE;

  return (
    <div
      onClick={handleClick}
      className={[
        'absolute',
        'flex items-center justify-center',
        'rounded-lg',
        'border-2',
        'select-none',
        'transition-transform',
        card.isClickable ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed brightness-75',
        'shadow-[0_6px_0_0_#b99258]',
        'bg-[#fef8e7]',
        'border-[#4f7a44]'
      ].join(' ')}
      style={{
        left: leftPx,
        top: topPx,
        zIndex: card.z,
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      }}
    >
      <span className="text-3xl leading-none">{card.kind}</span>
    </div>
  );
};

export default Card;

