/**
 * 层间错位：模拟“砌砖”效果
 *
 * 约定：
 * - x/y 是半步网格单位（整数），渲染时乘 GRID_SIZE
 * - 同层内部使用整数网格；跨层通过 offset 形成 0.5 格偏移（在此坐标系里等于 +1）
 */
export function offsetForLayer(z: number): { ox: number; oy: number } {
  // 奇数层整体偏移半格（+1 表示 0.5 格）
  if (z % 2 === 1) return { ox: 1, oy: 1 };
  return { ox: 0, oy: 0 };
}

