import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RuntimeCard, SlotAction } from '../types';

interface SlotBarProps {
  slotCards: RuntimeCard[];
  slotSize?: number;
  lastSlotAction: SlotAction | null;
}

const MAX_SLOTS = 7;
const ANIMATION_DURATION_MS = 220;

export const SlotBar: React.FC<SlotBarProps> = ({
  slotCards,
  slotSize = 56,
  lastSlotAction
}) => {
  const [renderedCards, setRenderedCards] = useState<RuntimeCard[]>(slotCards);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const removeTimeoutRef = useRef<number | null>(null);

  // 管理三消时的“短暂保留并播放消除动画”
  useEffect(() => {
    if (lastSlotAction?.type === 'remove' && lastSlotAction.removedIds?.length) {
      const removedSet = new Set(lastSlotAction.removedIds);

      setRenderedCards((prev) => {
        const removedCards = prev.filter((c) => removedSet.has(c.id));
        const base = Array.from({ length: MAX_SLOTS }, (_, index) => slotCards[index]).filter(
          (c): c is RuntimeCard => Boolean(c)
        );
        return [...base, ...removedCards];
      });

      setRemovingIds(removedSet);

      if (typeof window !== 'undefined') {
        if (removeTimeoutRef.current !== null) {
          window.clearTimeout(removeTimeoutRef.current);
        }
        removeTimeoutRef.current = window.setTimeout(() => {
          setRenderedCards(
            Array.from({ length: MAX_SLOTS }, (_, index) => slotCards[index]).filter(
              (c): c is RuntimeCard => Boolean(c)
            )
          );
          setRemovingIds(new Set());
        }, ANIMATION_DURATION_MS);
      }
    } else {
      setRenderedCards(
        Array.from({ length: MAX_SLOTS }, (_, index) => slotCards[index]).filter(
          (c): c is RuntimeCard => Boolean(c)
        )
      );
      setRemovingIds(new Set());
    }
  }, [slotCards, lastSlotAction]);

  useEffect(
    () => () => {
      if (typeof window !== 'undefined' && removeTimeoutRef.current !== null) {
        window.clearTimeout(removeTimeoutRef.current);
      }
    },
    []
  );

  // 简易 FLIP：当卡牌顺序或数量变化时，使用 transform 过渡它们的位置
  useLayoutEffect(() => {
    const previousRects = previousRectsRef.current;
    const newRects = new Map<string, DOMRect>();

    renderedCards.forEach((card) => {
      const el = itemRefs.current[card.id];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      newRects.set(card.id, rect);

      const prevRect = previousRects.get(card.id);
      if (!prevRect) return;

      const dx = prevRect.left - rect.left;
      const dy = prevRect.top - rect.top;

      if (dx === 0 && dy === 0) return;

      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;

      // 下一帧回到正常位置并加上过渡
      requestAnimationFrame(() => {
        el.style.transition = `transform ${ANIMATION_DURATION_MS}ms ease-out`;
        el.style.transform = '';
      });
    });

    previousRectsRef.current = newRects;
  }, [renderedCards]);

  const insertedId =
    lastSlotAction?.type === 'insert' && lastSlotAction.cardId ? lastSlotAction.cardId : null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-2">
      <div className="relative px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-4 border-[#6b4a1f] bg-[#9b6a2a] shadow-[0_8px_0_0_#6b4a1f]">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,#ffffff,transparent_55%),radial-gradient(circle_at_80%_70%,#000000,transparent_55%)]" />
        <div ref={containerRef} className="relative flex gap-2 sm:gap-3">
          {Array.from({ length: MAX_SLOTS }).map((_, index) => {
            const card = renderedCards[index];
            const key = card ? card.id : `empty-${index}`;

            return (
              <div
                key={key}
                ref={(el) => {
                  if (card) {
                    itemRefs.current[card.id] = el;
                  }
                }}
                style={{ width: slotSize, height: slotSize }}
                className={[
                  'rounded-xl border-2 border-[#e7d3a4] bg-[#6b4a1f]/25 flex items-center justify-center text-2xl sm:text-3xl',
                  card && insertedId === card.id ? 'slot-insert' : '',
                  card && removingIds.has(card.id) ? 'slot-remove' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {card ? card.kind : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SlotBar;

