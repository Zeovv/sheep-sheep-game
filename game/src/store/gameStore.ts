import { create } from 'zustand';
import type { GameState, HistoryEntry, LevelCard, RuntimeCard, SlotAction } from '../types';
import { recomputeClickability } from '../utils/collision';

const createRuntimeCardsFromLevelCards = (levelCards: LevelCard[]): RuntimeCard[] => {
  const runtimeCards: RuntimeCard[] = levelCards.map((card) => ({
    ...card,
    isClickable: false,
    removed: false,
    inSlot: false,
    coveredByIds: [],
    inBuffer: false
  }));

  return recomputeClickability(runtimeCards);
};

const placeCardIntoSlot = (
  slot: RuntimeCard[],
  card: RuntimeCard
): { slot: RuntimeCard[]; insertedIndex: number } => {
  const sameKindIndices = slot
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => c.kind === card.kind)
    .map(({ index }) => index);

  const nextSlot = [...slot];
  let insertedIndex = nextSlot.length;

  if (sameKindIndices.length > 0) {
    const lastIndex = sameKindIndices[sameKindIndices.length - 1];
    insertedIndex = lastIndex + 1;
    nextSlot.splice(insertedIndex, 0, card);
  } else {
    nextSlot.push(card);
  }

  return { slot: nextSlot, insertedIndex };
};

const applyTripleMatch = (
  slot: RuntimeCard[]
): { slot: RuntimeCard[]; removedIds: string[]; removedKind?: string } => {
  const kindCount: Record<string, number> = {};
  slot.forEach((c) => {
    kindCount[c.kind] = (kindCount[c.kind] || 0) + 1;
  });

  const kindsToClear = Object.keys(kindCount).filter((kind) => kindCount[kind] >= 3);
  if (kindsToClear.length === 0) return { slot, removedIds: [] };

  const removedIdsSet = new Set<string>();
  let removedKind: string | undefined;

  kindsToClear.forEach((kind) => {
    let needRemove = 3;
    const nextSlot: RuntimeCard[] = [];

    for (const c of slot) {
      if (c.kind === kind && needRemove > 0) {
        removedIdsSet.add(c.id);
        removedKind = kind;
        needRemove -= 1;
      } else {
        nextSlot.push(c);
      }
    }

    slot = nextSlot;
  });

  return { slot, removedIds: Array.from(removedIdsSet), removedKind };
};

export const useGameStore = create<GameState>((set) => ({
  levelId: 'demo-level',
  cards: [],
  slot: [],
  status: 'playing',
  lastSlotAction: null,
  history: [],
  buffer: [],
  shuffleTick: 0,
  actions: {
    initLevel: (levelCards: LevelCard[]) => {
      const cardsWithClickable = createRuntimeCardsFromLevelCards(levelCards);

      set((state) => ({
        ...state,
        levelId: 'demo-level',
        cards: cardsWithClickable,
        slot: [],
        status: 'playing',
        lastSlotAction: null,
        history: [],
        buffer: [],
        shuffleTick: 0
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

        const fromBuffer = state.buffer.includes(cardId);

        // 将卡牌加入槽位
        const updatedCard: RuntimeCard = {
          ...target,
          inSlot: true,
          inBuffer: false,
          isClickable: false
        };

        const newCards: RuntimeCard[] = state.cards.map((c, index) =>
          index === cardIndex ? updatedCard : c
        );

        const { slot: slotted, insertedIndex } = placeCardIntoSlot(state.slot, updatedCard);
        let newSlot: RuntimeCard[] = slotted;

        const matchResult = applyTripleMatch(newSlot);
        newSlot = matchResult.slot;
        const removedIdsSet = new Set(matchResult.removedIds);

        const cardsAfterRemove = newCards.map((c) =>
          removedIdsSet.has(c.id)
            ? {
                ...c,
                removed: true,
                inSlot: false,
                isClickable: false
              }
            : c
        );

        const cardsWithClickable = recomputeClickability(cardsAfterRemove);

        // 更新 buffer：如果是从 Pop Out 缓冲区点击回来的牌，则将其从 buffer 中移除
        const newBuffer = fromBuffer ? state.buffer.filter((id) => id !== cardId) : state.buffer;

        // 更新历史：仅当该牌最终仍在槽位中时才记录，可用于撤回
        const newHistory: HistoryEntry[] = [...state.history];
        if (!removedIdsSet.has(cardId)) {
          newHistory.push({ type: 'click', cardId });
        }

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

        const lastSlotAction: SlotAction =
          matchResult.removedIds.length > 0
            ? {
                type: 'remove',
                removedIds: matchResult.removedIds,
                kind: matchResult.removedKind
              }
            : {
                type: 'insert',
                cardId,
                insertedIndex
              };

        return {
          ...state,
          cards: cardsWithClickable,
          slot: newSlot,
          status,
          buffer: newBuffer,
          history: newHistory,
          lastSlotAction
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
          status: 'playing',
          lastSlotAction: null,
          history: [],
          buffer: [],
          shuffleTick: 0
        };
      });
    },
    popOut: () => {
      set((state) => {
        if (state.status !== 'playing') return state;
        if (state.slot.length < 3) return state;

        const toMove = state.slot.slice(0, 3);
        const remainingSlot = state.slot.slice(3);
        const moveIds = new Set(toMove.map((c) => c.id));

        // 不再修改 x/y，只是把牌标记为缓冲区，避免影响棋盘居中与重开逻辑
        const updatedCards: RuntimeCard[] = state.cards.map((card) =>
          moveIds.has(card.id)
            ? {
                ...card,
                inSlot: false,
                inBuffer: true
              }
            : card
        );

        const cardsWithClickable = recomputeClickability(updatedCards);

        return {
          ...state,
          cards: cardsWithClickable,
          slot: remainingSlot,
          buffer: toMove.map((c) => c.id),
          lastSlotAction: null
        };
      });
    },
    undo: () => {
      set((state) => {
        if (state.status !== 'playing') return state;
        if (state.history.length === 0) return state;

        const last = state.history[state.history.length - 1];
        if (last.type !== 'click') return state;

        const cardId = last.cardId;
        const cardInSlot = state.slot.find((c) => c.id === cardId);
        if (!cardInSlot) {
          // 该牌已经被三消或不在槽位中，当前版本不支持撤回
          return state;
        }

        const updatedCards: RuntimeCard[] = state.cards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                inSlot: false,
                removed: false
              }
            : card
        );

        const cardsWithClickable = recomputeClickability(updatedCards);
        const newSlot = state.slot.filter((c) => c.id !== cardId);
        const newHistory = state.history.slice(0, state.history.length - 1);

        return {
          ...state,
          cards: cardsWithClickable,
          slot: newSlot,
          history: newHistory,
          lastSlotAction: null
        };
      });
    },
    shuffle: () => {
      set((state) => {
        if (state.status !== 'playing') return state;

        const onBoardIndices: number[] = [];
        const kinds: string[] = [];

        state.cards.forEach((card, index) => {
          if (!card.removed && !card.inSlot && !card.inBuffer) {
            onBoardIndices.push(index);
            kinds.push(card.kind);
          }
        });

        if (onBoardIndices.length <= 1) {
          return state;
        }

        // 简单打乱算法
        for (let i = kinds.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = kinds[i];
          kinds[i] = kinds[j];
          kinds[j] = tmp;
        }

        const updatedCards: RuntimeCard[] = state.cards.map((card, index) => {
          const pos = onBoardIndices.indexOf(index);
          if (pos === -1) return card;

          return {
            ...card,
            kind: kinds[pos]
          };
        });

        const cardsWithClickable = recomputeClickability(updatedCards);

        return {
          ...state,
          cards: cardsWithClickable,
          shuffleTick: state.shuffleTick + 1
        };
      });
    }
  }
}));

