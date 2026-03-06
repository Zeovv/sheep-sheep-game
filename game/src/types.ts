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
  /**
   * 是否处于 Pop Out 的临时缓冲区中。
   * 处于缓冲区的牌不再出现在棋盘区域，而是由单独的缓冲区 UI 渲染。
   */
  inBuffer?: boolean;
  /**
   * 可选：用于 UI 层识别的一次性动画标签
   * 不参与核心逻辑判断，只做视觉效果控制。
   */
  animationTag?: 'toSlot' | 'fromSlot' | 'remove' | null;
}

export interface SlotAction {
  type: 'insert' | 'remove' | null;
  cardId?: string;
  insertedIndex?: number;
  removedIds?: string[];
  kind?: string;
}

export interface HistoryEntry {
  type: 'click';
  cardId: string;
}

// 游戏状态
export interface GameState {
  levelId: string;
  cards: RuntimeCard[]; // 所有卡牌
  slot: RuntimeCard[]; // 槽位中的卡牌（最大7张）
  status: 'playing' | 'won' | 'lost';
  /** 最近一次槽位相关的动作，用于驱动 UI 动画 */
  lastSlotAction: SlotAction | null;
  /** 简单操作历史：目前只记录最近点击进槽位的牌，用于撤回 */
  history: HistoryEntry[];
  /** Pop Out 移出的牌 ID 列表 */
  buffer: string[];
  /** 洗牌节奏计数器，每次洗牌自增，用于触发抖动动画 */
  shuffleTick: number;
  actions: {
    initLevel: (cards: LevelCard[]) => void;
    clickCard: (cardId: string) => void;
    restart: () => void;
    popOut: () => void;
    undo: () => void;
    shuffle: () => void;
  };
}
