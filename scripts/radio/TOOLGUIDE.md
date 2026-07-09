# 广播剧制作工具链 · AI 使用指南

> 本文档面向 AI 助手，用于指导广播剧剧本编写、语音合成、ASMR 混音、网页集成的完整流程。阅读本文档后，AI 应能够独立完成任意章节的广播剧制作。

---

## 一、目录结构与工具链概览

```
项目根目录/
├── scripts/radio/                          # 工具链目录
│   ├── generate_radio.py                   # 主脚本：剧本→TTS→混音→MP3
│   ├── generate_asmr.py                    # ASMR音效库生成器（一次性运行）
│   ├── assets/                             # 本地音效库（自动匹配源）
│   │   ├── asmr/                           # 非语言人声
│   │   │   ├── female_breath/              # 女声轻喘
│   │   │   ├── female_pant/                # 女声急促喘息
│   │   │   ├── female_moan/                # 女声呻吟
│   │   │   ├── female_scream/              # 女声尖叫
│   │   │   └── skin_slap/                  # 皮肤拍打声
│   │   ├── sfx/                            # 环境音效
│   │   │   └── engine/                     # 引擎声
│   │   └── bgm/                            # 背景音乐
│   │       ├── night_grassland/            # 夜晚草原虫鸣
│   │       └── contemplative/              # 思辨型（心跳）
│   └── output/                             # 生成产物
│       ├── failed_tts.log                  # 失败日志（重跑参考）
│       └── ...mp3
│
├── src/data/scenarios/hotwifeNovel/
│   ├── original/                           # 原文按章拆分（ch1.md ~ ch24.md）
│   ├── radio/                              # 广播剧剧本目录
│   │   ├── ch8.md                          # 已完成的范例剧本
│   │   └── output/                         # 该章节生成的mp3
│   └── ch8.ts ~ ch24.ts                    # 沉浸剧场剧本（剧情步骤数据）
│
├── public/audio/radio/                     # 网页可访问的音频目录
│   ├── manifest.json                       # 章节清单（播放器读取此文件）
│   └── ch8.mp3                             # 音频文件
│
└── src/components/views/RadioPlayerView.tsx # 网页播放器组件
```

### 工具链流程图

```
原文(original/chN.md)
    ↓ AI 改编
广播剧剧本(radio/chN.md)
    ↓ generate_radio.py
混音MP3(radio/output/chN.mp3)
    ↓ 复制到 public
网页音频(public/audio/radio/chN.mp3)
    ↓ 更新 manifest.json
播放器展示(RadioPlayerView)
```

---

## 二、前置环境要求

### 2.1 Docker TTS 服务

项目依赖本地 Docker 部署的 Edge TTS 服务（OpenAI 兼容 API）：

- **API 地址**: `http://localhost:5050/v1/audio/speech`
- **API Key**: `your_api_key_here`（容器配置，无需修改）
- **请求格式**: OpenAI TTS 兼容
- **启动方式**: `docker start <tts容器名>`

**验证服务可用**：
```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key_here" \
  -d '{"model":"tts-1","input":"测试","voice":"zh-CN-YunxiNeural","response_format":"mp3","speed":1.0}' \
  --output test.mp3
```

### 2.2 Python 依赖

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple pydub imageio-ffmpeg
```

- `pydub`: 音频处理
- `imageio-ffmpeg`: 自带 FFmpeg 二进制，无需 brew 安装

### 2.3 可用声线清单

Docker TTS 支持的中文声线（已验证）：

| 声线 ID | 性别 | 特点 |
|---------|------|------|
| `zh-CN-YunxiNeural` | 男 | 年轻成熟，适合旁白/丈夫 |
| `zh-CN-YunjianNeural` | 男 | 低沉有力，适合第三者 |
| `zh-CN-YunyangNeural` | 中性 | 成熟，可作女声替代 |
| `zh-CN-XiaoyiNeural` | 女 | 温柔甜美，适合妻子 |

**不可用声线**（容器未安装，会被 API 拒绝）：
- `zh-CN-XiaochenNeural`
- `zh-CN-XiaohanNeural`

---

## 三、广播剧剧本编写规范

### 3.1 剧本文件位置

- 路径：`src/data/scenarios/hotwifeNovel/radio/chN.md`
- 参考：`ch8.md` 是已完成的标准范例

### 3.2 剧本头部（元数据）

每个剧本文件以如下结构开头：

```markdown
# 第N章 章节标题 - 广播剧剧本

## 元数据

- 章节序号: chN
- 原文字数: XXXX
- 预计时长: XX 分钟
- 场景数: X
- 声线角色: X + 旁白
- 制作策略: 混合策略 + ASMR叙事

## 角色声线设定

| 标签 | 角色 | 声线描述 |
|------|------|----------|
| N | 旁白（第一人称"我"） | 成熟男声，略低沉 |
| M | 丈夫（"我"的对白） | 与旁白同人，情绪更外放 |
| F | 诗音（老婆） | 温柔女声 |
| Y | 杨琛 | 低沉磁性男声 |
| X | 许莹莹 | 妩媚爽朗女声 |
```

### 3.3 核心格式：TTS 朗读单元

**这是脚本解析的核心格式，必须严格遵守**：

```
[角色 | 情绪 | 语速 | 音量]
文本内容（一行或多行）
```

**字段说明**：

| 字段 | 取值 | 说明 |
|------|------|------|
| 角色 | `N` / `M` / `F` / `Y` / `X` | 见角色声线设定表 |
| 情绪 | 自由文本 | 如"压抑兴奋""迷离呻吟""渴求加重"，仅作参考 |
| 语速 | `慢` / `中` / `偏快` / `快` | 映射为 0.85x / 1.0x / 1.15x / 1.3x |
| 音量 | `低` / `中` / `高` | 映射为 -6dB / 0dB / +4dB |

**示例**：
```markdown
[N | 压抑兴奋 | 中 | 低]
见老婆的淫水越挖越多，我默默躲到车后面。

[F | 迷离呻吟 | 慢 | 中]
啊……杨琛的大鸡巴……大鸡巴快操我……操我……
```

### 3.4 特殊标记（非朗读）

| 标记 | 格式 | 含义 | 处理方式 |
|------|------|------|----------|
| 背景音乐 | `[BGM: 描述]` | 持续背景音 | 从音效库匹配，循环播放 |
| 环境音效 | `[SFX: 描述]` | 一次性音效 | 从音效库匹配，播放一次 |
| ASMR | `[ASMR: 描述 时长 修饰]` | 非语言人声 | 从音效库匹配 |
| 停顿 | `[PAUSE: Ns]` | 静音停顿 | 插入 N 秒静音 |
| 动作提示 | `(动作)` | 表演参考 | 不朗读，仅参考 |

**ASMR 标记格式详解**：

```
[ASMR: 关键词描述 时长 修饰词]
```

- **关键词描述**：必须包含音效库映射表中的关键词（见 3.5）
- **时长**：`Ns`（如 `3s`、`8s`、`持续`），用于裁剪/循环
- **修饰词**：`渐弱`/`尖锐`/`失控`/`中速`/`加快`/`加剧`，影响选曲

**示例**：
```markdown
[ASMR: 女声低声喘息 3s 渐弱]
[ASMR: 节奏性皮肤拍打声 持续 8s 中速]
[ASMR: 女声尖叫 2s 失控]
[PAUSE: 1.5s]
```

### 3.5 音效库关键词映射表

**编写 ASMR/SFX/BGM 标记时，描述中必须包含以下关键词之一**，否则无法匹配音效，会变成静音：

| 关键词 | 音效类型 | 对应音效目录 |
|--------|----------|--------------|
| `女声低声喘息` | ASMR | `asmr/female_breath/` |
| `女声急促喘息` | ASMR | `asmr/female_pant/` |
| `女声断续喘息` | ASMR | `asmr/female_pant/` |
| `女声过度刺激喘息` | ASMR | `asmr/female_pant/` |
| `女声呻吟` | ASMR | `asmr/female_moan/` |
| `女声高昂呻吟` | ASMR | `asmr/female_moan/` |
| `女声短促惊叫` | ASMR | `asmr/female_scream/` |
| `女声尖叫` | ASMR | `asmr/female_scream/` |
| `女声潮吹尖叫` | ASMR | `asmr/female_scream/` |
| `女声无力轻笑` | ASMR | `asmr/female_breath/` |
| `女声微弱呼吸` | ASMR | `asmr/female_breath/` |
| `皮肤拍打声` | ASMR | `asmr/skin_slap/` |
| `节奏性皮肤拍打声` | ASMR | `asmr/skin_slap/`（选 slow 版本） |
| `手指快速摩擦声` | ASMR | `asmr/skin_slap/`（选 fast 版本） |
| `引擎发动` | SFX | `sfx/engine/` |
| `草原虫鸣` | BGM | `bgm/night_grassland/` |
| `草原环境底噪` | BGM | `bgm/night_grassland/` |
| `环境底噪` | BGM | `bgm/night_grassland/` |
| `虫鸣声` | BGM | `bgm/night_grassland/` |
| `夜晚草原` | BGM | `bgm/night_grassland/` |
| `低沉思辨型背景乐` | BGM | `bgm/contemplative/` |

**修饰词影响选曲**：
- 描述含 `加快` / `加剧` → 优先选 `fast` 版本
- 描述含 `渐强` / `失控` / `顶点` → 优先选 `intense` 版本

### 3.6 改编策略

**混合策略**（推荐）：
- **语义台词**（含词义的对白和呻吟）→ TTS 朗读
- **纯拟声词**（"啊啊""咿咿""呜呜"）→ 转为 `[ASMR]` 标记
- **呼吸/气声/身体声音** → `[ASMR]` 标记
- **高潮节点** → 纯 ASMR + 旁白补充情绪

**注意事项**：
1. TTS 有 Azure 内容审查，过于直白的色情描述可能被拒绝。失败时会自动重试 3 次，仍失败则插入静音并记录到 `failed_tts.log`
2. 拟声词转为 ASMR 时，要补充情绪描述（如"女声尖叫 2s 失控"）
3. 原文中的 `{0}` / `{1}` 占位符需替换为具体角色称呼（"我"/"老婆"等）
4. 每个朗读单元前后自动加 150ms 静音，无需手动添加

---

## 四、生成广播剧音频

### 4.1 基本命令

```bash
# 完整生成
python3 scripts/radio/generate_radio.py src/data/scenarios/hotwifeNovel/radio/chN.md

# 预览模式（只生成前5个TTS片段，快速验证）
python3 scripts/radio/generate_radio.py src/data/scenarios/hotwifeNovel/radio/chN.md --preview 5

# 指定输出路径
python3 scripts/radio/generate_radio.py src/.../chN.md --output custom/output.mp3
```

### 4.2 生成流程

脚本自动执行 4 个步骤：

1. **解析剧本**：提取 TTS 朗读单元和音效标记
2. **TTS 生成**：调用 Docker TTS API，每个片段带 3 次重试，失败则静音占位
3. **混音**：TTS 人声 + ASMR/SFX/BGM 音效按时间轴拼接
4. **导出**：FFmpeg 转码为 192k MP3

### 4.3 缓存机制

- TTS 生成结果缓存在 `.cache/tts/`，以 MD5(文本+声线+语速) 为文件名
- **重复运行时已生成的片段秒级完成**，只重跑失败/新增的片段
- 如需强制重新生成：删除 `.cache/tts/` 下对应文件

### 4.4 失败处理

- 失败片段记录到 `scripts/radio/output/failed_tts.log`
- 日志格式包含：时间、角色、情绪、声线、失败原因、原文
- **修复方法**：检查日志中的文本是否触发内容审查，适当改写后重跑

### 4.5 输出验证

生成完成后检查：
```bash
# 查看输出文件
ls -lh src/data/scenarios/hotwifeNovel/radio/output/chN.mp3

# 查看失败日志（无文件=全部成功）
cat scripts/radio/output/failed_tts.log

# 查看音效匹配统计（脚本输出最后一行）
# 如: "音效库命中: 26/41"
```

---

## 五、集成到网页播放器

### 5.1 复制音频文件

```bash
cp src/data/scenarios/hotwifeNovel/radio/output/chN.mp3 public/audio/radio/chN.mp3
```

### 5.2 更新 manifest.json

编辑 `public/audio/radio/manifest.json`，追加章节记录：

```json
[
  {
    "id": "ch8",
    "chapter": "第八章",
    "title": "淫妻入圈第三步，突破底线",
    "desc": "杨琛真正插入的那一刻——妻子彻底沦陷，丈夫隔车观看这场入圈仪式。",
    "file": "ch8.mp3",
    "duration": 921,
    "tags": ["淫妻", "入圈", "旁观", "NTR"]
  },
  {
    "id": "chN",
    "chapter": "第N章",
    "title": "章节标题（不含'第N章'前缀）",
    "desc": "一句话简介，30字以内",
    "file": "chN.mp3",
    "duration": 实际秒数,
    "tags": ["标签1", "标签2"]
  }
]
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识，建议用 `chN` |
| `chapter` | string | 章节序号，如"第八章" |
| `title` | string | 章节标题（不含序号前缀） |
| `desc` | string | 一句话简介，30字以内 |
| `file` | string | 音频文件名（相对 `public/audio/radio/`） |
| `duration` | number | 音频总秒数（整数） |
| `tags` | string[] | 标签数组，2-4个 |

**duration 获取方法**：
```bash
# 方法1：从脚本输出读取（"总时长: 921.0s"）
# 方法2：用 ffprobe
ffprobe -v error -show_entries format=duration -of csv=p=0 public/audio/radio/chN.mp3
```

### 5.3 验证

播放器会自动读取 `manifest.json` 并展示所有章节，无需修改代码。

访问路径：游戏中心 → 📻 广播剧 → 选择章节 → 播放

---

## 六、扩展音效库

### 6.1 生成新音效

运行 ASMR 音效库生成器：

```bash
python3 scripts/radio/generate_asmr.py
```

此脚本通过 TTS 合成女声 ASMR，通过程序生成环境音。已有音效会跳过。

### 6.2 添加自定义音效

1. 将 mp3 文件放入 `scripts/radio/assets/` 对应子目录
2. 在 `generate_radio.py` 的 `SFX_KEYWORD_MAP` 中添加映射：

```python
SFX_KEYWORD_MAP = {
    # ...现有映射
    "你的新关键词": ("asmr/新目录", "文件名模式_*.mp3"),
}
```

### 6.3 目录命名规范

```
assets/
├── asmr/           # 非语言人声
│   ├── female_*/   # 女声类（breath/pant/moan/scream）
│   └── skin_slap/  # 身体声音
├── sfx/            # 环境音效
│   ├── engine/     # 引擎
│   ├── footsteps/  # 脚步（待补充）
│   └── phone/      # 手机（待补充）
└── bgm/            # 背景音乐
    ├── night_grassland/  # 夜晚草原
    └── contemplative/    # 思辨型
```

---

## 七、完整制作 Checklist

制作一个新章节的广播剧，按以下步骤执行：

- [ ] **1. 阅读原文**：读取 `src/data/scenarios/hotwifeNovel/original/chN.md`
- [ ] **2. 编写剧本**：按本文档第三章规范，输出到 `src/data/scenarios/hotwifeNovel/radio/chN.md`
- [ ] **3. 验证格式**：确保所有 TTS 单元格式为 `[角色 | 情绪 | 语速 | 音量]`，ASMR 标记包含映射表关键词
- [ ] **4. 预览测试**：`python3 scripts/radio/generate_radio.py src/.../chN.md --preview 5`
- [ ] **5. 完整生成**：`python3 scripts/radio/generate_radio.py src/.../chN.md`
- [ ] **6. 检查失败**：查看 `scripts/radio/output/failed_tts.log`，如有失败则改写文本后重跑
- [ ] **7. 检查音效命中**：脚本输出"音效库命中: X/Y"，未命中的 ASMR 标记需补充关键词
- [ ] **8. 复制到网页**：`cp src/.../output/chN.mp3 public/audio/radio/chN.mp3`
- [ ] **9. 更新清单**：编辑 `public/audio/radio/manifest.json` 追加章节记录
- [ ] **10. 验证播放**：启动 `pnpm dev`，在游戏中心→广播剧中试听

---

## 八、常见问题排查

### Q1: TTS 生成失败（failed_tts.log 有记录）

**原因**：Azure 内容审查触发，或网络问题

**解决**：
1. 查看日志中的失败文本
2. 改写敏感词（如"鸡巴"→"硬物"，"操"→"要"）
3. 删除 `.cache/tts/` 中对应的缓存文件
4. 重跑脚本（已成功的会走缓存）

### Q2: ASMR 音效未匹配（静音）

**原因**：标记描述中不包含映射表关键词

**解决**：检查 `[ASMR: ...]` 描述，确保包含第三章 3.5 节中的关键词

### Q3: ffprobe 警告

**现象**：`RuntimeWarning: Couldn't find ffprobe`

**影响**：不影响功能，脚本已用 imageio-ffmpeg 自带的 ffmpeg 替代

### Q4: Docker TTS 服务无响应

**排查**：
```bash
# 检查容器状态
docker ps | grep tts

# 测试 API
curl http://localhost:5050/v1/models

# 重启容器
docker restart <容器名>
```

### Q5: 声线不可用（API 返回错误）

**排查**：参考第二章 2.3 节可用声线清单，避免使用 `XiaochenNeural` 等未安装声线

---

## 九、关键配置速查

### 角色声线映射（generate_radio.py）

| 角色标签 | 声线 | 用途 |
|----------|------|------|
| N | zh-CN-YunxiNeural | 旁白 |
| M | zh-CN-YunxiNeural | 丈夫对白 |
| F | zh-CN-XiaoyiNeural | 妻子（诗音） |
| Y | zh-CN-YunjianNeural | 第三者（杨琛） |
| X | zh-CN-YunyangNeural | 许莹莹 |

### 语速/音量映射

| 语速标签 | speed 值 | 音量标签 | dB 调整 |
|----------|----------|----------|---------|
| 慢 | 0.85 | 低 | -6 |
| 中 | 1.0 | 中 | 0 |
| 偏快 | 1.15 | 高 | +4 |
| 快 | 1.3 | | |

---

## 十、参考文件

- 剧本范例：`src/data/scenarios/hotwifeNovel/radio/ch8.md`
- 主脚本：`scripts/radio/generate_radio.py`
- 音效生成：`scripts/radio/generate_asmr.py`
- 播放器组件：`src/components/views/RadioPlayerView.tsx`
- 章节清单：`public/audio/radio/manifest.json`
- 原文章节：`src/data/scenarios/hotwifeNovel/original/ch1.md ~ ch24.md`
- 改编手册：`src/data/scenarios/hotwifeNovel/IMPORTANT-改编手册.md`
