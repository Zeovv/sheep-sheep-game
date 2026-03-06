// 基础卡牌定义（静态数据）
export interface LevelCard {
  id: string;
  kind: string; // 比如 'sheep', 'grass', 'fire'
  x: number; // 网格坐标 x
  y: number; // 网格坐标 y
  z: number; // 层级，越大越靠上
  w: number; // 宽度（通常是1或2）
  h: number; // 高度
  layer: number; // 辅助层级，用于简单的z-index处理
}

// 运行时卡牌（包含状态）
export interface RuntimeCard extends LevelCard {
  isClickable: boolean; // 是否可点击（没有被上层遮挡）
  removed: boolean; // 是否已消除
  inSlot: boolean; // 是否在槽位中
  coveredByIds: string[]; // 遮挡它的卡牌ID列表（关键优化！）
}

// 游戏状态
export interface GameState {
  levelId: string;
  cards: RuntimeCard[]; // 所有卡牌
  slot: RuntimeCard[]; // 槽位中的卡牌（最大7张）
  status: 'playing' | 'won' | 'lost';
  actions: {
    initLevel: (cards: LevelCard[]) => void;
    clickCard: (cardId: string) => void;
    restart: () => void;
  };
}
