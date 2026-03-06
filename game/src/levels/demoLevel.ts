import type { LevelCard } from '../types';

// 6 种牌：🐑🌿🔥🍀🐰🌸，每种恰好 3 张，共 18 张，保证可通关
// 布局：底层 3x3（z=0），中层 2x3（z=1），顶层 1x3（z=2），形成明显重叠
const KINDS = ['🐑', '🌿', '🔥', '🍀', '🐰', '🌸'] as const;

function card(
  id: string,
  kind: string,
  x: number,
  y: number,
  z: number,
  layer: number
): LevelCard {
  return { id, kind, x, y, z, w: 1, h: 1, layer };
}

export const DEMO_LEVEL_CARDS: LevelCard[] = [
  // z=0 底层 9 张
  card('c1', KINDS[0], 1, 1, 0, 0),
  card('c2', KINDS[1], 2, 1, 0, 0),
  card('c3', KINDS[2], 3, 1, 0, 0),
  card('c4', KINDS[3], 1, 2, 0, 0),
  card('c5', KINDS[4], 2, 2, 0, 0),
  card('c6', KINDS[5], 3, 2, 0, 0),
  card('c7', KINDS[0], 1, 3, 0, 0),
  card('c8', KINDS[1], 2, 3, 0, 0),
  card('c9', KINDS[2], 3, 3, 0, 0),
  // z=1 中层 6 张，压在上半区
  card('c10', KINDS[3], 1, 1, 1, 1),
  card('c11', KINDS[4], 2, 1, 1, 1),
  card('c12', KINDS[5], 3, 1, 1, 1),
  card('c13', KINDS[0], 1, 2, 1, 1),
  card('c14', KINDS[1], 2, 2, 1, 1),
  card('c15', KINDS[2], 3, 2, 1, 1),
  // z=2 顶层 3 张
  card('c16', KINDS[3], 1, 1, 2, 2),
  card('c17', KINDS[4], 2, 1, 2, 2),
  card('c18', KINDS[5], 3, 1, 2, 2)
];
