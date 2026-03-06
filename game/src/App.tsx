import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { SlotBar } from './components/SlotBar';
import { useGameStore } from './store/gameStore';
import type { RuntimeCard } from './types';
import { CARD_WIDTH, GRID_SIZE } from './constants';
import { generateLevel } from './utils/levelGenerator';

export const App: React.FC = () => {
  const { cards, slot, buffer, status, lastSlotAction, shuffleTick, actions } = useGameStore();
  const levelCards = useMemo(() => generateLevel(), []);

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const boardSize = useMemo(() => {
    if (levelCards.length === 0) return { minW: 800, minH: 600 };
    const maxX = Math.max(...levelCards.map((c) => c.x + (c.w || 2)));
    const maxY = Math.max(...levelCards.map((c) => c.y + (c.h || 2)));
    return {
      minW: Math.max(800, (maxX + 1) * GRID_SIZE),
      minH: Math.max(600, (maxY + 1) * GRID_SIZE)
    };
  }, [levelCards]);

  useEffect(() => {
    actions.initLevel(levelCards);
  }, [actions, levelCards]);

  // 计算棋盘在当前视口下的缩放比例
  const hudHeight = 80; // 顶部条预留高度
  const bottomReserved = 180; // 底部槽位 + 按钮预留高度
  const availableWidth = Math.max(320, viewport.width * 0.96);
  const availableHeight = Math.max(300, viewport.height - hudHeight - bottomReserved);

  const designWidth = boardSize.minW;
  const designHeight = boardSize.minH;

  const scale = Math.min(
    availableWidth / designWidth,
    availableHeight / designHeight,
    1 // 不放大超过设计尺寸，主要用于缩小适配
  );

  const scaledCardWidth = CARD_WIDTH * scale;
  const slotSize = Math.max(40, Math.min(80, scaledCardWidth));

  // 棋盘到槽位的飞行动画状态
  interface FlyingCard {
    id: string;
    kind: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }

  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const prevCardsRef = useRef<RuntimeCard[]>(cards);
  const prevSlotRef = useRef<RuntimeCard[]>(slot);

  useEffect(() => {
    const prevCards = prevCardsRef.current;
    const prevSlot = prevSlotRef.current;

    const prevSlotIds = new Set(prevSlot.map((c) => c.id));
    const curSlotIds = new Set(slot.map((c) => c.id));

    const movedToSlotIds = Array.from(curSlotIds).filter((id) => !prevSlotIds.has(id));

    if (movedToSlotIds.length > 0) {
      const GAP = 8;
      const MAX_SLOTS = 7;

      movedToSlotIds.forEach((id) => {
        const prevCard = prevCards.find((c) => c.id === id);
        const curCard = cards.find((c) => c.id === id);
        if (!prevCard || !curCard) return;

        // 只在牌确实是从棋盘/缓冲区进入槽位时触发
        if (prevCard.inSlot || curCard.removed === true) return;

        const targetIndex = slot.findIndex((c) => c.id === id);
        if (targetIndex === -1) return;

        // 以视口中心为原点估算起点/终点（上方棋盘 → 下方槽位）
        const boardCenterY = (hudHeight - bottomReserved) / 2;
        const slotCenterY = boardCenterY + bottomReserved * 0.9;
        const offsetIndex = targetIndex - (MAX_SLOTS - 1) / 2;
        const slotCenterX = offsetIndex * (slotSize + GAP);

        const flying: FlyingCard = {
          id: `${id}-${Date.now()}`,
          kind: curCard.kind,
          fromX: 0,
          fromY: boardCenterY,
          toX: slotCenterX,
          toY: slotCenterY
        };

        setFlyingCards((prev) => [...prev, flying]);

        if (typeof window !== 'undefined') {
          const DURATION = 260;
          window.setTimeout(() => {
            setFlyingCards((prevList) => prevList.filter((f) => f.id !== flying.id));
          }, DURATION);
        }
      });
    }

    prevCardsRef.current = cards;
    prevSlotRef.current = slot;
  }, [cards, slot, hudHeight, bottomReserved, slotSize]);

  const bufferCards: RuntimeCard[] = buffer
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is RuntimeCard => Boolean(c));

  const isGameOver = status === 'won' || status === 'lost';
  const isWin = status === 'won';

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#bff36a]">
      {/* 顶部栏（简化版） */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-black/80 text-white px-6 py-2 rounded-xl text-lg font-semibold shadow">
          3月6日
        </div>
      </div>

      {/* 从棋盘飞向槽位的动画层 */}
      {flyingCards.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div className="relative w-full h-full">
            {flyingCards.map((card) => (
              <div
                key={card.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate(${card.toX}px, ${card.toY}px)`,
                  transition: 'none',
                  opacity: 0
                }}
                ref={(el) => {
                  if (!el) return;
                  const duration = 260;
                  el.style.transition = 'none';
                  el.style.transform = `translate(${card.fromX}px, ${card.fromY}px)`;
                  el.style.opacity = '1';
                  requestAnimationFrame(() => {
                    el.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
                    el.style.transform = `translate(${card.toX}px, ${card.toY}px)`;
                    el.style.opacity = '0';
                  });
                }}
              >
                <div
                  style={{
                    width: slotSize,
                    height: slotSize
                  }}
                  className="rounded-lg border-2 border-[#4f7a44] shadow-[0_6px_0_0_#b99258] bg-[#fef8e7] flex items-center justify-center text-2xl"
                >
                  {card.kind}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pop Out 临时缓冲区：显示被移出的最多 3 张牌，位于 GameBoard 与 SlotBar 之间 */}
      {bufferCards.length > 0 && (
        <div className="fixed bottom-52 left-1/2 -translate-x-1/2 z-30 flex gap-2 px-2">
          {bufferCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => actions.clickCard(card.id)}
              className="rounded-xl border-2 border-[#4f7a44] bg-[#fef8e7] shadow-[0_4px_0_0_#b99258] flex items-center justify-center text-2xl"
              style={{
                width: slotSize,
                height: slotSize
              }}
            >
              {card.kind}
            </button>
          ))}
        </div>
      )}

      {/* 中央棋盘 */}
      <div className="w-full h-full flex items-center justify-center pt-16 pb-32">
        <div
          className="relative rounded-2xl border-4 border-[#5aa84f] bg-[#d7ff9c] shadow-[0_10px_0_0_#4a8f42] overflow-hidden flex items-center justify-center"
          style={{
            width: `min(96vw, ${availableWidth}px)`,
            height: `min(82vh, ${availableHeight}px)`,
            minWidth: 320,
            minHeight: 400
          }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: designWidth,
              height: designHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              minWidth: designWidth,
              minHeight: designHeight
            }}
          >
            <GameBoard
              cards={cards}
              onCardClick={(id) => actions.clickCard(id)}
              shuffleTick={shuffleTick}
            />
          </div>
        </div>
      </div>

      {/* 底部槽位栏 */}
      <SlotBar slotCards={slot} slotSize={slotSize} lastSlotAction={lastSlotAction} />

      {/* 底部按钮栏 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-4 sm:gap-6">
        <button
          type="button"
          className="w-20 h-12 sm:w-24 sm:h-16 rounded-2xl bg-[#4aa3ff] border-4 border-[#1b6bb6] shadow-[0_6px_0_0_#1b6bb6] text-white font-bold text-sm sm:text-base"
          onClick={() => actions.restart()}
        >
          重开
        </button>
        <button
          type="button"
          className="w-20 h-12 sm:w-24 sm:h-16 rounded-2xl bg-[#4aa3ff] border-4 border-[#1b6bb6] shadow-[0_6px_0_0_#1b6bb6] text-white font-bold text-sm sm:text-base"
          onClick={() => actions.popOut()}
        >
          移出
        </button>
        <button
          type="button"
          className="w-20 h-12 sm:w-24 sm:h-16 rounded-2xl bg-[#4aa3ff] border-4 border-[#1b6bb6] shadow-[0_6px_0_0_#1b6bb6] text-white font-bold text-sm sm:text-base"
          onClick={() => actions.undo()}
        >
          撤回
        </button>
        <button
          type="button"
          className="w-20 h-12 sm:w-24 sm:h-16 rounded-2xl bg-[#4aa3ff] border-4 border-[#1b6bb6] shadow-[0_6px_0_0_#1b6bb6] text-white font-bold text-sm sm:text-base"
          onClick={() => actions.shuffle()}
        >
          洗牌
        </button>
      </div>

      {/* 游戏结束弹窗（胜利 / 失败） */}
      {isGameOver && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isWin ? 'victory-overlay' : 'defeat-overlay'
          }`}
        >
          <div
            className={`mx-4 max-w-xs rounded-3xl px-6 py-5 text-center shadow-xl ${
              isWin ? 'victory-modal' : 'defeat-modal'
            }`}
          >
            <div className="text-2xl font-extrabold mb-2">
              {isWin ? '游戏胜利！' : '游戏失败'}
            </div>
            <div className="text-sm text-[#444] mb-4">
              {isWin ? '太棒了，成功通关这一局～' : '卡槽被占满了，再来试一次吧。'}
            </div>
            <button
              type="button"
              onClick={() => actions.restart()}
              className="inline-flex items-center justify-center rounded-2xl bg-[#4aa3ff] border-4 border-[#1b6bb6] shadow-[0_6px_0_0_#1b6bb6] px-6 py-2 text-white font-bold text-sm"
            >
              再玩一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

