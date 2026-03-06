import { create } from 'zustand';
import type { GameState, LevelCard, RuntimeCard } from '../types';

const computeTopClickable = (cards: RuntimeCard[]): RuntimeCard[] => {
  const maxZByPos: Record<string, number> = {};

  cards.forEach((card) => {
    if (card.removed || card.inSlot) return;
    const key = `${card.x}-${card.y}`;
    const prev = maxZByPos[key];
    if (prev === undefined || card.z > prev) {
      maxZByPos[key] = card.z;
    }
  });

  return cards.map((card) => {
    if (card.removed || card.inSlot) {
      return { ...card, isClickable: false };
    }
    const key = `${card.x}-${card.y}`;
    const isTop = card.z === maxZByPos[key];
    return { ...card, isClickable: isTop };
  });
};

const createRuntimeCardsFromLevelCards = (levelCards: LevelCard[]): RuntimeCard[] => {
  const runtimeCards: RuntimeCard[] = levelCards.map((card) => ({
    ...card,
    isClickable: false,
    removed: false,
    inSlot: false,
    coveredByIds: []
  }));

  return computeTopClickable(runtimeCards);
};

export const useGameStore = create<GameState>((set) => ({
  levelId: 'demo-level',
  cards: [],
  slot: [],
  status: 'playing',
  actions: {
    initLevel: (levelCards: LevelCard[]) => {
      const cardsWithClickable = createRuntimeCardsFromLevelCards(levelCards);

      set((state) => ({
        ...state,
        levelId: 'demo-level',
        cards: cardsWithClickable,
        slot: [],
        status: 'playing'
      }));
    },
    clickCard: (cardId: string) => {
      set((state) => {
        if (state.status !== 'playing') return state;

        const cardIndex = state.cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return state;

        const target = state.cards[cardIndex];
        if (!target.isClickable || target.removed) {
          return state;
        }

        // 将卡牌加入槽位
        const updatedCard: RuntimeCard = {
          ...target,
          inSlot: true,
          isClickable: false
        };

        const newCards: RuntimeCard[] = state.cards.map((c, index) =>
          index === cardIndex ? updatedCard : c
        );

        let newSlot: RuntimeCard[] = [...state.slot, updatedCard];

        // 三消检查
        const kindCount: Record<string, number> = {};
        newSlot.forEach((c) => {
          kindCount[c.kind] = (kindCount[c.kind] || 0) + 1;
        });

        const kindsToClear = Object.keys(kindCount).filter(
          (kind) => kindCount[kind] >= 3
        );

        const removedIds = new Set<string>();

        if (kindsToClear.length > 0) {
          kindsToClear.forEach((kind) => {
            let needRemove = 3;
            const nextSlot: RuntimeCard[] = [];

            for (const c of newSlot) {
              if (c.kind === kind && needRemove > 0) {
                removedIds.add(c.id);
                needRemove -= 1;
              } else {
                nextSlot.push(c);
              }
            }

            newSlot = nextSlot;
          });
        }

        const cardsAfterRemove = newCards.map((c) =>
          removedIds.has(c.id)
            ? {
                ...c,
                removed: true,
                inSlot: false,
                isClickable: false
              }
            : c
        );

        const cardsWithClickable = computeTopClickable(cardsAfterRemove);

        // 失败判定：槽位超过7且无法继续消除
        let status: GameState['status'] = state.status;
        if (newSlot.length > 7) {
          status = 'lost';
        }

        // 胜利判定：所有卡牌都被移除
        const allRemoved = cardsWithClickable.every((c) => c.removed);
        if (allRemoved) {
          status = 'won';
        }

        return {
          ...state,
          cards: cardsWithClickable,
          slot: newSlot,
          status
        };
      });
    },
    restart: () => {
      set((state) => {
        if (state.cards.length === 0) return state;

        const levelCards: LevelCard[] = state.cards.map((c) => ({
          id: c.id,
          kind: c.kind,
          x: c.x,
          y: c.y,
          z: c.z,
          w: c.w,
          h: c.h,
          layer: c.layer
        }));

        const resetCards = createRuntimeCardsFromLevelCards(levelCards);

        return {
          ...state,
          cards: resetCards,
          slot: [],
          status: 'playing'
        };
      });
    }
  }
}));

