# 情侣飞行棋 — 题库优化 & 角色命名 & 任务个性化

## 一、当前结构

```
src/data/
├── statePools.ts          # 状态池（actionStates/conditionStates）解析工具
├── defaultThemes.ts       # 导出入口
├── scripts/
└── themes/
    ├── index.ts           # 汇总所有 Theme 并注入 mode
    ├── couplePrelude.ts
    ├── coupleSweet.ts
    ├── coupleWarmup.ts
    ├── coupleFirewood.ts
    ├── coupleTemptation.ts  ← 本次测试题库
    ├── coupleUnion.ts
    ├── coupleRoleplay.ts
    ├── coupleRewardPunish.ts
    ├── coupleContractLovers.ts
    └── normal*.ts          # 普通模式题库（无 [M]/[F]/[both] 需求）
```

### Theme 类型定义（`src/types/index.ts`）

```ts
interface Theme {
  id: string;
  name: string;
  desc: string;
  mode: GameMode;
  audience: 'common' | 'male' | 'female';
  tasks: string[];
  actionStates?: string[];
  conditionStates?: string[];
}
```

### Player 类型定义

```ts
interface Player {
  id: number;
  name: string;
  color: string;
  role: 'male' | 'female';
  step: number;
  themeId: string | null;
}
```

---

## 二、发现的问题 & 优化项

### 问题 1：tasks 性别前缀不规范

- `[M]` / `[F]` / `[both]` / 无前缀 四种用法混用
- 引擎 `pickTaskForRole`（`useGameState.ts`）通过 `startsWith('[M]')` / `startsWith('[F]')` 过滤，无前缀和 `[both]` 都 fallthrough 到 `return true`（所有人可见）
- **展示层 bug**：`TaskCardModal.tsx` 用 `replace(/^\[[MF]\]/, '')` 剥离前缀，但不匹配 `[both]`，导致 `[both]` 显示的原文

**影响**：无法精确控制任务性别路由，UI 上会裸露显示 `[both]` 标签。

### 问题 2：任务文本全部硬编码，无个性化

- 任务中写死"男生""女生""你""对方"等称呼
- 当玩家自定义名字后（如曹操/貂蝉），体验割裂
- 解剖学术语中包含 A/B 格式（如"睾丸/阴唇"、"精液/爱液"），应根据执行者/接收者性别自动选择

### 问题 3：玩家固定为"男方"/"女方"

- 硬编码在 `INITIAL_PLAYERS` 和 6 个 UI 位置
- 无法自定义名字，缺少代入感
- 无持久化机制（但有通用的 localStorage 工具函数）

### 问题 4：难度等级混杂在 desc 字段

- 如 `desc: '口舌侍奉与极限挑逗 (Level 4)'`，无法在 UI 中按难度筛选

### 问题 5：无 i18n 支持

- 全部文本为中文硬编码，无抽离为 key-value 结构

---

## 三、改造方案

### 建议 1：角色命名 + localStorage 持久化

- 在 `HomeView` 添加可点击编辑的名字输入框
- `useGameState` 新增 `setPlayerName` action
- 已有 `useEffect` 自动同步 localStorage，无需额外持久化代码
- 所有 `'男方'/'女方'` 硬编码替换为 `player.name`

### 建议 2：任务文本个性化

- 新增 `src/utils/personalizeTask.ts`
- 输入：`rawTask, executor: Player, recipient: Player`
- 输出：替换后的文本
- 替换规则：

| 匹配 | 替换逻辑 |
|------|---------|
| `男生` | executor male → executor.name / else → recipient.name |
| `女生` | executor female → executor.name / else → recipient.name |
| `对方` | → recipient.name |
| `你自己的` | → `${executor.name}自己的` |
| `你自己` | → `${executor.name}自己` |
| `自己的` | → `${executor.name}自己的` |
| `你的` | → `${executor.name}的` |
| `你` | → executor.name（remaining standalone） |
| `睾丸/阴唇` | recipient male → 睾丸 / female → 阴唇 |
| `精液/爱液` | recipient male → 精液 / female → 爱液 |
| `阴蒂/龟头` | recipient female → 阴蒂 / male → 龟头 |
| `后穴/阴道` | recipient female → 后穴/阴道 / male → 后穴 |
| `爱液/前液` | executor female → 爱液 / male → 前液 |

### 建议 3：任务按性别前缀过滤

- 引擎 `pickTaskForRole` 已支持 `[M]` / `[F]` 过滤
- 只需补全所有 theme 的 tasks 前缀：
  - 主语为男生的 → `[M]`
  - 主语为女生的 → `[F]`
  - 双方均可执行 / 双方共同参与 / 角色可互换 → `[both]`
  - 剔除无前缀写法（引擎角度无前缀 ≈ `[both]`，但 UI 展示不一致）

---

## 四、已实施的修改（阶段 P0-P5）

### P0：修复 coupleTemptation 前缀

- 36 条无前缀任务 → 加上 `[both]`
- #38 `[M]`→`[F]`（原文"女生给男生口交"，主语是女生）
- #39 `[F]`→`[M]`（原文"男生口交到女生高潮"，主语是男生）

### P1：修复 UI 前缀剥离 bug

```ts
// 修改前（不匹配 [both]）
.replace(/^\[[MF]\]/, '')
// 修改后
.replace(/^\[(?:M|F|both)\]\s*/, '')
```

### P2：实现 personalizeTask 工具函数

**文件**：`src/utils/personalizeTask.ts`
**核心逻辑**：前缀剥离 → 解剖术语 A/B 选择（基于 recipient/executor 性别） → 称呼替换（男生/女生/对方/你/自己的）

### P3：在 useGameState 中应用 personalize

- 在 collision/lucky/trap 三处 `TaskEventData` 创建时，用 `personalizeTask()` 包装 `pickTaskForRole()` 结果
- collision/lucky：`executor=opponent, recipient=activePlayer`
- trap：`executor=activePlayer, recipient=opponent`

### P4：角色命名 UI + setPlayerName

- `useGameState` 新增 `setPlayerName(playerId, name)`
- `HomeView` 新增点击编辑名字功能（input 内联替换，Enter/blur 确认，Escape 取消）
- `App.tsx` 透传

### P5：替换硬编码男方/女方

| 位置 | 修改内容 |
|------|---------|
| `TaskCardModal.tsx:36` | `executorLabel` 改为通过 `players.find()` 查名字 |
| `GameView.tsx:149` | 顶部标签 男方→players[0].name |
| `GameView.tsx:161` | 顶部标签 女方→players[1].name |
| `GameView.tsx:181` | StatusPanel 标签 |
| `GameView.tsx:198` | StatusPanel 标签 |
| `GameView.tsx:228-229` | 状态通知文本 |

不修改的（固定性别标签，非玩家名）：`ThemesView`（仅男方/仅女方）、`ThemeCreateModal`/`ThemeEditorModal`（仅限男方/仅限女方）、`CharacterIntroView`（脚本角色固定标签）。

---

## 五、已完成的所有修改

| 阶段 | 内容 | 文件 |
|------|------|------|
| P0 | fix coupleTemptation 前缀（36条 `[both]`，#38/39 换序） | `coupleTemptation.ts` |
| P1 | fix UI `[both]`不剥离 | `TaskCardModal.tsx` |
| P2 | `personalizeTask()` 名字 + 解剖术语替换 | 新建 `personalizeTask.tsx` |
| P3 | useGameState 三处 trigger 应用 personalize | `useGameState.ts` |
| P4 | 角色命名 UI + setPlayerName | `HomeView.tsx`, `useGameState.ts`, `App.tsx` |
| P5 | 所有"男方/女方"硬编码→`player.name` | `TaskCardModal.tsx`, `GameView.tsx` |
| P6 | 名字着色（彩色 span） | `personalizeTask.tsx` (renderColoredTaskText) |
| P7 | 题库 A/B 模式全覆盖 | `personalizeTask.tsx`（补充7个新模式） |
| P8 | 任务历史记录（localStorage + JSON导出 + 耗时） | 新建 `taskHistory.ts`, `HistoryModal.tsx`, 修改 `App.tsx`, `GameView.tsx` |

### 当前 personalizeTask 覆盖的所有 A/B 模式

#### 基于接收者性别（RECIPIENT_PATTERNS）

| 模式 | 男→ | 女→ |
|------|------|------|
| `睾丸/阴唇` | 睾丸 | 阴唇 |
| `精液/爱液` | 精液 | 爱液 |
| `阴蒂/龟头` | 龟头 | 阴蒂 |
| `龟头/阴蒂` | 龟头 | 阴蒂 |
| `后穴/阴道` | 后穴 | 后穴/阴道 |
| `阴唇/包皮系带` | 包皮系带 | 阴唇 |
| `他/她` | 他 | 她 |

#### 基于执行者性别（EXECUTOR_PATTERNS）

| 模式 | 男→ | 女→ |
|------|------|------|
| `爱液/前液` | 前液 | 爱液 |
| `唾液/汗/爱液` | 唾液/汗/前液 | 唾液/汗/爱液 |

### 任务历史记录数据模型

```ts
interface TaskHistoryEntry {
  id: string;
  timestamp: number;       // 任务出现时间
  resolvedAt: number;      // 任务解决时间
  duration: number;        // 耗时（秒）
  round: number;           // 第几回合
  executorName: string;    // 执行者名字
  task: string;            // 个性化后的任务文本
  completed: boolean;      // true=完成, false=拒绝
  type: string;            // 'collision' | 'lucky' | 'trap'
}
```

存储于 localStorage key `task-history`，支持：
- 游戏中点击顶部历史按钮查看
- 按回合倒序排列
- 显示任务类型、耗时、完成状态
- 一键下载 JSON 文件
- 一键清空

## 六、待完成

### P6：前缀规范推广到剩余 couple 主题

| 文件 | 总数 | 无前缀 | 需处理 |
|------|------|--------|--------|
| `couplePrelude.ts` | 35 | 24 | 24 |
| `coupleSweet.ts` | 50 | 50 | 50 |
| `coupleWarmup.ts` | 50 | 41 | 41 |
| `coupleFirewood.ts` | 50 | 38 | 38 |
| `coupleUnion.ts` | 49 | 49 | 49 |
| `coupleRoleplay.ts` | 30 | 11 | 11 |
| `coupleRewardPunish.ts` | 25 | 24 | 24 |
| `coupleContractLovers.ts` | 35 | 15 | 15 |
| **合计** | **324** | **252** | **252** |

### 远期可选

- 难度等级从 `desc` 抽出为独立字段 `difficulty?: number`
- i18n 多语言支持（抽离为 key-value）
- `actionStates`/`conditionStates` 也接入 personalize
- 脚色头像（Avatar）选择

---

## 六、验收标准

- [ ] `coupleTemptation.ts` 每一条 task 都有 `[M]`/`[F]`/`[both]` 前缀
- [ ] 任务卡片 UI 不显示前缀原文
- [ ] 玩家可在 Home 页自定义名字，刷新后保持
- [ ] 任务文本中"男生/女生"被替换为对应玩家名
- [ ] 任务文本中 A/B 解剖术语根据性别自动选择
- [ ] 游戏全界面（顶部标签、任务卡片、状态面板）显示玩家名字而非"男方/女方"
- [ ] `npm run typecheck` 无新增错误
- [ ] `npm run build` 通过
