# 淫妻开发之路 · 改编手册

> 本文档供 AI 在后续章节改编时参考，避免来回修改。

---

## 一、文件结构与规约

```
src/data/scenarios/hotwifeNovel/
  index.ts         ← 组装所有章节，导出 HOTWIFE_NOVEL
  ch1.ts           ← 第一章
  ch2.ts           ← 第二章
  ch3.ts           ← 第三章（新建）
  ...
```

**新增章节步骤：**
1. 在 `src/data/scenarios/hotwifeNovel/` 下创建 `chN.ts`
2. 在 `index.ts` 顶部 `import { chN } from './chN'`
3. 在 `acts: [ch1, ch2, chN]` 末尾追加

**不要修改** `src/data/scenarios/index.ts`，它已经 re-export 了 `hotwifeNovel/index.ts` 的 `HOTWIFE_NOVEL`。

---

## 二、单个章节的格式

```ts
import { Act } from '../../../types';

export const ch3: Act = {
  title: '第三章 · 章节副标题',
  desc: '一句话简介，显示在幕间过渡页。',
  steps: [
    // ... steps
  ],
};
```

---

## 三、Step 类型与使用场景

### 1. `narration`（叙述）
原文情节推进。纯叙述，玩家只需阅读，按钮显示"继续"。

```ts
{
  type: 'narration',
  actor: 'both',   // 或 0（丈夫）、1（妻子）
  text: '叙述内容…',
}
```

### 2. `question`（问答）
插入在情节关键节点，让玩家反思/讨论。带 suggestions 选项供参考，按钮显示"回答问题 ✓"。

```ts
{
  type: 'question',
  actor: 0,         // 指定由谁回答（'both' 表示双方各自回答后交流）
  text: '问题内容…',
  suggestions: [
    '选项一',
    '选项二',
  ],
}
```

### 3. `command`（指令）
要求玩家在现实中执行一个动作。按钮显示"执行指令 ✓"。

```ts
{
  type: 'command',
  actor: 0,
  text: '指令描述…',
}
```

---

## 四、actor 规则

| 值 | 含义 | 徽章色 | 名字色 |
|---|---|---|---|
| `0` | 丈夫（男方） | 蓝 `#0A84FF` | 蓝 |
| `1` | 妻子（女方） | 粉 `#FF375F` | 粉 |
| `'both'` | 双方 | 绿 `#30D158` | 双方名字按各自颜色 |

**问题步的 actor 交替规则：**
- 如果连续多个问题步，应交替让男、女回答，不要连续两个问题都给同一个人
- 允许 `'both'` 类型问题（双方各自思考后交流）

---

## 五、文本占位符系统

| 占位符 | 替换为 | 颜色 |
|---|---|---|
| `{0}` | 男方名字（如"小宋"） | 蓝 `#0A84FF` |
| `{1}` | 女方名字（如"方诗音"） | 粉 `#FF375F` |
| `{actor}` | 当前 step 的执行者名字 | 按 actor 颜色 |
| `{partner}` | 当前 step 的对方名字 | 按 actor 颜色 |

**原文名字替换规则（从第三章起）：**
- 原文 "宋先生" → `{0}先生`
- 原文 "诗音" / "老婆" → `{1}`（只保留有称呼意义的场景，不要过度替换）
- 原文 "我们" / "我" → 保持原文视角，自然使用

---

## 六、对话格式化规则

原文中的对话行必须格式化为 `说话人：说的内容`，并直接嵌入叙述文本中。

```
正确：
{0}说：老婆，要不我们关了灯做？
{1}只是诧异片刻，便笑道：都随你…

正确（多轮对话）：
{0}说：骚货…想不想被别的男人操…
{1}说：呜呜…想，都给我…都操我…呜呜…
{0}说：我想看你被人操…去找大鸡巴男人操死你好不好！
{1}说：好…呜呜…我要大鸡巴…呜呜…

注意区分引用原文 vs 旁白叙述：
- "客服说：……" —— 原文中客服发来的消息，保留
- "邮件中写道：\n……" —— 原文中展示的邮件内容，保留
```

---

## 七、长文本拆分规则

**核心原则：每步只讲一个核心事件，太长必须拆分。**

- 以 `\n\n` 为段落分隔符，一个 step 最多 2 个 `\n\n`（即最多 3 段）
- 超过 3 段的块必须在 `\n\n` 处拆分为多个 `narration` step
- 拆分后的每个 step 的 `actor` 保持相同

**拆分示例：**
```ts
// 原文（太长，要拆）：
text: '8 个段落长文…\n\n段2…\n\n段3…\n\n段4…\n\n段5…\n\n段6…\n\n段7…\n\n段8…'

// 拆为：
{ type: 'narration', actor: 'both', text: '8 个段落长文…', },
{ type: 'narration', actor: 'both', text: '段2…', },
{ type: 'narration', actor: 'both', text: '段3…\n\n段4…', },  // 短段可合并
{ type: 'narration', actor: 'both', text: '段5…\n\n段6…', },
{ type: 'narration', actor: 'both', text: '段7…\n\n段8…', },
```

**何时不拆分：**
- 一段话内部有 `\n`（而非 `\n\n`）是同一段落内换行，不要拆
- `question` 和 `command` 类型的 text 不需要拆分（它们通常本身不长）
- 如果内容逻辑上是一个整体（如：某人连续说的几句引语），可以不拆

---

## 八、Question step 设计原则

1. **每章约 8-12 个问题步**，均匀分布在关键情节节点
2. **每个问题要结合原文情节**，引导玩家代入角色
3. 问题后的 `suggestions` 给出 3-5 个参考回答，要有代表性
4. **suggestions 中也要使用占位符**：`{partner}`、`{actor}` 等
5. 不要问太笼统的问题，要问"在刚才那个场景下你是什么感觉/想法"

**问题类型参考：**
- 男主内心矛盾类（兴奋 vs 愧疚、醋意 vs 刺激）
- 女主感受类（紧张 vs 刺激、配合 vs 真实渴望）
- 双方交流类（猜测对方想法、坦率表达需求）

---

## 九、改编忠实度原则

1. **情节必须严格跟随原文**，不能原创或随意修改
2. 原文的对话要尽量保留原话，只做格式调整（加引述人）
3. 旁白/内心独白保留原文语气
4. 原文没有的内容不能添加（除非是引导性问题中的情景复述）
5. 淫秽内容保持原文尺度，不放大也不缩小

---

## 十、原文对照方法

原文在 `src/data/test.txt`，按章节划分。

找到目标章节后：
1. 通读整章，理解情节线
2. 找出关键对话和内心独白
3. 按三幕剧结构设计节奏：铺垫 → 冲突/发展 → 高潮/转折 → 收尾
4. 在情节推进中嵌入问题步（约每 3-5 个 narration 步插 1 个 question 步）
5. 最后一步通常是总结性质的问题或指令

---

## 十一、代码风格规范

- **不要写任何代码注释**
- 使用 `const chN: Act = { ... }` 命名（`ch1`、`ch2`……）
- 字符串用单引号
- 每行不超过 120 字符

---

## 十二、改编标准模板

```ts
import { Act } from '../../../types';

export const ch3: Act = {
  title: '第三章 · 标题',
  desc: '一句话简介',
  steps: [
    // 1-2 步：上章回顾 / 场景过渡（用 command 或 narration）
    { type: 'command', actor: 'both', text: '开场指令…', },

    // 3-10 步：情节推进 + 交替问题
    { type: 'narration', actor: 'both', text: '情节叙述…', },
    { type: 'narration', actor: 'both', text: '情节叙述…', },
    { type: 'question', actor: 0, text: '问题…', suggestions: ['…', '…'], },
    { type: 'narration', actor: 'both', text: '情节叙述…', },
    { type: 'question', actor: 1, text: '问题…', suggestions: ['…', '…'], },
    { type: 'narration', actor: 'both', text: '情节叙述…', },

    // 高潮部分
    { type: 'narration', actor: 'both', text: '高潮情节…', },
    { type: 'question', actor: 0, text: '问题…', suggestions: ['…', '…'], },
    { type: 'question', actor: 1, text: '问题…', suggestions: ['…', '…'], },

    // 收尾
    { type: 'narration', actor: 'both', text: '章节收尾…', },
    { type: 'question', actor: 'both', text: '总结问题…', suggestions: ['…', '…'], },
  ],
};
```

---

## 十三、对比检查清单（改编完成后逐项核对）

- [ ] 所有原文中"宋先生"替换为 `{0}先生`
- [ ] 所有对话格式化为 `姓名：内容`
- [ ] 没有超过 3 个 `\n\n` 的长文本块
- [ ] question 步使用了 `actor: 0` / `actor: 1` / `actor: 'both'`（不要遗漏）
- [ ] suggestions 中包含 `{actor}` / `{partner}` / `{0}` / `{1}` 占位符
- [ ] 同一章节内 actor 交替合理
- [ ] 在 `index.ts` 中注册了该章节
- [ ] `npx tsc --noEmit` 编译通过
