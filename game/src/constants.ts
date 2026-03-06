export const GRID_SIZE = 40; // 单位网格像素（半步网格）
export const CARD_WIDTH = GRID_SIZE * 2; // 一张牌占 2x2 网格
export const CARD_HEIGHT = GRID_SIZE * 2;

// Pop Out 功能使用的临时缓冲区坐标（以半步网格为单位）
// 这里选在棋盘左上方的一块区域，避免与主布局冲突。
export const POP_BUFFER_POSITIONS = [
  { x: 0, y: -4 },
  { x: 3, y: -4 },
  { x: 6, y: -4 }
] as const;

