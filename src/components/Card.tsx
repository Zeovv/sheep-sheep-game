import React from 'react';
import type { RuntimeCard } from '../types';

interface CardProps {
  card: RuntimeCard;
  onClick?: () => void;
}

const TILE_SIZE = 48; // 单位像素，用于根据网格坐标计算位置

export const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const handleClick = () => {
    if (!card.isClickable) return;
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={[
        'absolute',
        'flex items-center justify-center',
        'w-10 h-10', // 40px * 40px
        'rounded-md',
        'border-2 border-green-500',
        'bg-white',
        card.isClickable ? 'cursor-pointer' : 'cursor-not-allowed brightness-50',
        'shadow'
      ].join(' ')}
      style={{
        left: card.x * TILE_SIZE,
        top: card.y * TILE_SIZE,
        zIndex: card.z
      }}
    >
      <span className="text-xl">{card.kind}</span>
    </div>
  );
};

export default Card;

