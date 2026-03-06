import type { RuntimeCard } from '../types';

/**
 * 判断一张牌是否被上方的其他牌遮挡
 * 基于 2x2 网格占位，x/y 为网格坐标。
 * 同 z 时用数组下标作 tie-breaker，与 DOM 绘制顺序一致（后渲染的在上方）。
 */
export const isCardObscured = (
  target: RuntimeCard,
  targetIndex: number,
  allCards: RuntimeCard[]
): boolean => {
  return allCards.some((upper, upperIndex) => {
    if (upper.id === target.id) return false;
    if (upper.removed || upper.inSlot) return false;
    if (upper.z < target.z) return false;
    if (upper.z === target.z && upperIndex <= targetIndex) return false;

    const dx = Math.abs(upper.x - target.x);
    const dy = Math.abs(upper.y - target.y);
    const xOverlap = dx < 2;
    const yOverlap = dy < 2;
    return xOverlap && yOverlap;
  });
};

/**
 * 重新基于遮挡关系计算所有牌的 isClickable
 */
export const recomputeClickability = (cards: RuntimeCard[]): RuntimeCard[] => {
  return cards.map((card, index) => {
    if (card.removed) {
      return { ...card, isClickable: false };
    }
    // 槽位中的牌由 SlotBar 控制显示，不可在棋盘中点击
    if (card.inSlot) {
      return { ...card, isClickable: false };
    }
    // Pop Out 缓冲区中的牌总是可点击，由独立缓冲区 UI 负责展示
    if (card.inBuffer) {
      return { ...card, isClickable: true };
    }
    const covered = isCardObscured(card, index, cards);
    return { ...card, isClickable: !covered };
  });
};

