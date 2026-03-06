import type { LevelCard } from '../types';
import type { LevelTemplate } from '../levels/templates';
import { templates } from '../levels/templates';
import { offsetForLayer } from './offset';

const KINDS = [
  '🍎',
  '🍌',
  '🍇',
  '🍉',
  '🍊',
  '🍋',
  '🍍',
  '🥭',
  '🍏',
  '🍐',
  '🍑',
  '🍒',
  '🍓',
  '🌸',
  '🐑'
] as const;

const NUM_KINDS = 15;
const CARDS_PER_KIND = 9;
const TARGET_TOTAL = NUM_KINDS * CARDS_PER_KIND; // 135，3 的倍数

// 每张牌占 2x2 网格
const CARD_GRID_SIZE = 2;

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function pickTemplate(rnd: () => number): LevelTemplate {
  const idx = Math.floor(rnd() * templates.length);
  return templates[idx] ?? templates[0];
}

function positionsFromTemplate(template: LevelTemplate): Array<{ x: number; y: number; z: number }> {
  const out: Array<{ x: number; y: number; z: number }> = [];

  template.layers.forEach((layer) => {
    const { ox, oy } = offsetForLayer(layer.z);
    for (let y = 0; y < layer.rows.length; y += 1) {
      const row = layer.rows[y];
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] !== 1) continue;
        out.push({ x: x * 2 + ox, y: y * 2 + oy, z: layer.z });
      }
    }
  });

  return out;
}

function shuffleInPlace<T>(arr: T[], rnd: () => number) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function buildKindBag(rnd: () => number): string[] {
  const kindsFlat: string[] = [];
  for (let k = 0; k < NUM_KINDS; k += 1) {
    for (let t = 0; t < CARDS_PER_KIND; t += 1) {
      kindsFlat.push(KINDS[k]);
    }
  }
  shuffleInPlace(kindsFlat, rnd);
  return kindsFlat;
}

export function generateLevel(seed: number = Date.now()): LevelCard[] {
  const rnd = seededRandom(seed);
  const template = pickTemplate(rnd);

  // 1) 基于模板生成基础坐标
  const basePositions = positionsFromTemplate(template);

  // 2) 复制/抽样到目标数量（保持布局形态 + 多层厚度）
  const positions: Array<{ x: number; y: number; z: number }> = [];
  while (positions.length < TARGET_TOTAL) {
    positions.push(...basePositions);
  }
  positions.length = TARGET_TOTAL;
  shuffleInPlace(positions, rnd);

  // 3) 分配种类（每种数量固定为 9，必然是 3 的倍数）
  const kinds = buildKindBag(rnd);

  // 4) 计算整体包围盒，并把布局移动到更接近“棋盘中心”
  //    这里以最小 x/y 向右下偏移一个固定边距，让布局不要贴边。
  const tmpCards: Array<{ x: number; y: number; z: number }> = positions.map((p) => ({ ...p }));
  const minX = Math.min(...tmpCards.map((c) => c.x));
  const minY = Math.min(...tmpCards.map((c) => c.y));
  const margin = 6; // 半步网格单位的边距（= 3 格）
  const shiftX = margin - minX;
  const shiftY = margin - minY;

  // 5) 输出 cards，并确保同 z 时的渲染顺序稳定：先“后景”，后“前景”
  const rawCards: LevelCard[] = tmpCards.map((pos, i) => ({
    id: `c${i}`,
    kind: kinds[i],
    x: pos.x + shiftX,
    y: pos.y + shiftY,
    z: pos.z,
    w: CARD_GRID_SIZE,
    h: CARD_GRID_SIZE,
    layer: pos.z
  }));

  rawCards.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    // 同层：y 小的更靠上（后景），先渲染；y 大的更靠下（前景），后渲染
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return rawCards;
}
