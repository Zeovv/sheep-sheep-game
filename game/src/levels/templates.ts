export type Cell = 0 | 1;

export interface LayerPattern {
  z: number;
  // rows[y][x]，1 表示该位置有一张牌（位置点），0 表示空
  rows: Cell[][];
}

export interface LevelTemplate {
  id: string;
  width: number; // pattern 宽（以单元格计）
  height: number; // pattern 高
  layers: LayerPattern[];
}

const rect = (w: number, h: number, fill: Cell = 1): Cell[][] =>
  Array.from({ length: h }, () => Array.from({ length: w }, () => fill));

/**
 * mainGateTemplate：接近截图的“门框 + 台阶塔”形态
 *
 * - 左右两堵墙 + 中间通道
 * - 顶部横梁连接左右
 * - 中部有一块平台，层数逐步收缩
 */
export const mainGateTemplate: LevelTemplate = {
  id: 'mainGate',
  width: 13,
  height: 15,
  layers: [
    // z=0：底层门框
    (() => {
      const rows = rect(13, 15, 0);
      // 左右墙（竖柱）
      for (let y = 3; y <= 13; y += 1) {
        rows[y][1] = 1;
        rows[y][2] = 1;
        rows[y][10] = 1;
        rows[y][11] = 1;
      }
      // 顶部横梁
      for (let x = 1; x <= 11; x += 1) rows[3][x] = 1;
      // 底部基座（稍收）
      for (let x = 2; x <= 10; x += 1) rows[13][x] = 1;
      // 两侧补强
      rows[12][2] = 1;
      rows[12][10] = 1;
      return { z: 0, rows };
    })(),

    // z=1：内收一格的门框 + 平台
    (() => {
      const rows = rect(13, 15, 0);
      for (let y = 4; y <= 12; y += 1) {
        rows[y][2] = 1;
        rows[y][3] = 1;
        rows[y][9] = 1;
        rows[y][10] = 1;
      }
      for (let x = 2; x <= 10; x += 1) rows[4][x] = 1;
      // 中部平台
      for (let x = 4; x <= 8; x += 1) rows[8][x] = 1;
      for (let x = 4; x <= 8; x += 1) rows[9][x] = 1;
      return { z: 1, rows };
    })(),

    // z=2：更小的平台，偏上
    (() => {
      const rows = rect(13, 15, 0);
      for (let x = 5; x <= 7; x += 1) rows[6][x] = 1;
      for (let x = 4; x <= 8; x += 1) rows[7][x] = 1;
      for (let x = 5; x <= 7; x += 1) rows[8][x] = 1;
      // 左右上方加几张，接近截图两侧“高台”
      rows[5][3] = 1;
      rows[5][9] = 1;
      return { z: 2, rows };
    })(),

    // z=3：顶层少量牌，形成“塔顶/凸出”
    (() => {
      const rows = rect(13, 15, 0);
      // 左右顶部各一小堆
      rows[2][2] = 1;
      rows[2][10] = 1;
      rows[3][2] = 1;
      rows[3][10] = 1;
      // 中央一点
      rows[5][6] = 1;
      // 中央下方再添一行，形成更像“门框内平台”
      rows[10][5] = 1;
      rows[10][6] = 1;
      rows[10][7] = 1;
      return { z: 3, rows };
    })(),

    // z=4：极少数完全重叠“柱状叠层”（用同一格多层来做厚度）
    (() => {
      const rows = rect(13, 15, 0);
      rows[2][2] = 1;
      rows[2][10] = 1;
      return { z: 4, rows };
    })(),

    // z=5：再叠一层厚度
    (() => {
      const rows = rect(13, 15, 0);
      rows[2][2] = 1;
      rows[2][10] = 1;
      return { z: 5, rows };
    })()
  ]
};

export const templates: LevelTemplate[] = [mainGateTemplate];

