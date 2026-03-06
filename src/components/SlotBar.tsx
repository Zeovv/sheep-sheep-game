import React from 'react';
import type { RuntimeCard } from '../types';

interface SlotBarProps {
  slotCards: RuntimeCard[];
}

const MAX_SLOTS = 7;

export const SlotBar: React.FC<SlotBarProps> = ({ slotCards }) => {
  const slots = Array.from({ length: MAX_SLOTS }, (_, index) => slotCards[index]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-800/70 px-3 py-2 rounded-xl">
      {slots.map((card, index) => (
        <div
          key={index}
          className="w-10 h-10 rounded-md border border-gray-400 bg-gray-700 flex items-center justify-center text-xl text-white"
        >
          {card ? card.kind : ''}
        </div>
      ))}
    </div>
  );
};

export default SlotBar;

