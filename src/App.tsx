import React, { useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { SlotBar } from './components/SlotBar';
import { useGameStore } from './store/gameStore';
import type { LevelCard } from './types';

const TEST_LEVEL_CARDS: LevelCard[] = [
  {
    id: 'c1',
    kind: '🐑',
    x: 2,
    y: 2,
    z: 0,
    w: 1,
    h: 1,
    layer: 0
  },
  {
    id: 'c2',
    kind: '🌿',
    x: 2,
    y: 2,
    z: 1,
    w: 1,
    h: 1,
    layer: 1
  },
  {
    id: 'c3',
    kind: '🔥',
    x: 3,
    y: 2,
    z: 0,
    w: 1,
    h: 1,
    layer: 0
  },
  {
    id: 'c4',
    kind: '🐑',
    x: 3,
    y: 3,
    z: 1,
    w: 1,
    h: 1,
    layer: 1
  },
  {
    id: 'c5',
    kind: '🌿',
    x: 1,
    y: 1,
    z: 2,
    w: 1,
    h: 1,
    layer: 2
  }
];

export const App: React.FC = () => {
  const { cards, slot, status, actions } = useGameStore();

  useEffect(() => {
    actions.initLevel(TEST_LEVEL_CARDS);
  }, [actions]);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-emerald-50">
      <div className="relative w-[320px] h-[420px] border border-emerald-300 rounded-lg shadow bg-white overflow-hidden">
        <GameBoard cards={cards} onCardClick={(id) => actions.clickCard(id)} />
        <SlotBar slotCards={slot} />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="text-gray-700">状态：{status}</div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-emerald-500 text-white text-sm hover:bg-emerald-600"
          onClick={() => actions.restart()}
        >
          重新开始
        </button>
      </div>
    </div>
  );
};

export default App;

