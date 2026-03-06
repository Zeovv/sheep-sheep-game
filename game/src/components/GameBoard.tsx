import React from 'react';
import type { RuntimeCard } from '../types';
import { GRID_SIZE } from '../constants';
import { Card } from './Card';

interface GameBoardProps {
  cards: RuntimeCard[];
  onCardClick?: (cardId: string) => void;
  shuffleTick?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ cards, onCardClick, shuffleTick }) => {
  // 只渲染仍在棋盘上的牌（未消除、未进槽位、未在缓冲区）；
  // 进槽的牌只在 SlotBar 显示，缓冲区中的牌由单独的缓冲栏显示。
  const boardCards = cards.filter((c) => !c.removed && !c.inSlot && !c.inBuffer);

  // 计算当前牌堆的包围盒，用于在棋盘区域中做精确居中
  let offsetX = 0;
  let offsetY = 0;

  if (boardCards.length > 0) {
    const minX = Math.min(...boardCards.map((c) => c.x));
    const minY = Math.min(...boardCards.map((c) => c.y));
    const maxX = Math.max(...boardCards.map((c) => c.x + (c.w ?? 2)));
    const maxY = Math.max(...boardCards.map((c) => c.y + (c.h ?? 2)));

    const contentCenterX = ((minX + maxX) / 2) * GRID_SIZE;
    const contentCenterY = ((minY + maxY) / 2) * GRID_SIZE;

    // App 中棋盘的设计尺寸：与 boardSize 的计算保持一致
    const designWidth = Math.max(800, (maxX + 1) * GRID_SIZE);
    const designHeight = Math.max(600, (maxY + 1) * GRID_SIZE);

    const boardCenterX = designWidth / 2;
    const boardCenterY = designHeight / 2;

    offsetX = boardCenterX - contentCenterX;
    offsetY = boardCenterY - contentCenterY;
  }

  const shuffleClass = shuffleTick && shuffleTick > 0 ? 'board-shuffle' : '';

  return (
    <div className="w-full h-full bg-slate-100 overflow-hidden">
      <div
        key={shuffleTick}
        className={`relative w-full h-full ${shuffleClass}`}
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`
        }}
      >
        {boardCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={onCardClick ? () => onCardClick(card.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;

