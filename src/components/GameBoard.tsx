import React from 'react';
import type { RuntimeCard } from '../types';
import { Card } from './Card';

interface GameBoardProps {
  cards: RuntimeCard[];
  onCardClick?: (cardId: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ cards, onCardClick }) => {
  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onClick={onCardClick ? () => onCardClick(card.id) : undefined}
        />
      ))}
    </div>
  );
};

export default GameBoard;

