#!/usr/bin/env python3
"""
广播剧端到端生成脚本
从剧本.md → Docker TTS人声 + ASMR音效 → 混音 → 最终音频

依赖:
  pip install pydub imageio-ffmpeg
  Docker: edge-tts 容器运行在 localhost:5050

用法:
  python3 scripts/radio/generate_radio.py src/data/scenarios/hotwifeNovel/radio/ch8.md
  python3 scripts/radio/generate_radio.py src/data/scenarios/hotwifeNovel/radio/ch8.md --output output/ch8.mp3
"""

import argparse
import hashlib
import json
import os
import random
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Optional, Tuple

# pydub + imageio-ffmpeg（自带ffmpeg二进制，无需brew安装）
from pydub import AudioSegment
import imageio_ffmpeg

# 设置ffmpeg路径
FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = FFMPEG_PATH

# 失败日志路径
FAILED_LOG = Path("scripts/radio/output/failed_tts.log")


def log_failed_tts(element, voice: str, speed: float, reason: str):
    """记录TTS生成失败的片段到日志，方便后续检查"""
    FAILED_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(FAILED_LOG, 'a', encoding='utf-8') as f:
        f.write(
            f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
            f"角色={element.role} 情绪={element.emotion} 语速={element.rate} 音量={element.volume} "
            f"voice={voice} speed={speed}\n"
            f"原因: {reason}\n"
            f"文本: {element.text}\n"
            f"{'-'*60}\n"
        )


def mp3_to_audiosegment(mp3_path: str) -> Optional[AudioSegment]:
    """用ffmpeg将mp3转为wav再加载，绕过ffprobe依赖"""
    wav_path = mp3_path.rsplit('.', 1)[0] + '.wav'
    try:
        subprocess.run(
            [FFMPEG_PATH, '-y', '-i', mp3_path, '-f', 'wav', '-acodec', 'pcm_s16le', '-ar', '24000', '-ac', '1', wav_path],
            capture_output=True, timeout=30
        )
        return AudioSegment.from_wav(wav_path)
    except Exception as e:
        print(f"\n  音频转换错误: {e}")
        return None
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)

# ============================================================
# 配置
# ============================================================

# Docker Edge TTS API 配置
TTS_API_URL = os.environ.get("TTS_API_URL", "http://localhost:5050/v1/audio/speech")
TTS_API_KEY = os.environ.get("TTS_API_KEY", "your_api_key_here")

# 角色声线映射
VOICE_MAP = {
    "N": "zh-CN-YunxiNeural",      # 旁白（"我"）- 年轻成熟男声
    "M": "zh-CN-YunxiNeural",      # 丈夫对白（与旁白同人）
    "F": "zh-CN-XiaoyiNeural",     # 诗音 - 温柔甜美女声
    "Y": "zh-CN-YunjianNeural",    # 杨琛 - 低沉有力男声
    "X": "zh-CN-YunyangNeural",    # 许莹莹 - 成熟女声（Xiaochen不可用，用Yunyang替代）
}

# 语速映射（通过 speed 参数传递给API，1.0为正常）
RATE_MAP = {
    "慢": 0.85,
    "中": 1.0,
    "偏快": 1.15,
    "快": 1.3,
}

# 音量映射（pydub后处理，dB）
VOLUME_MAP = {
    "低": -6,
    "中": 0,
    "高": 4,
}

# ============================================================
# 时长解析
# ============================================================

def parse_duration_ms(desc: str) -> int:
    """从音效描述中解析时长（毫秒）"""
    match = re.search(r'(\d+(?:\.\d+)?)\s*s', desc)
    if match:
        return int(float(match.group(1)) * 1000)
    return 2000

def parse_pause_ms(desc: str) -> int:
    """从 [PAUSE: Ns] 中解析停顿时长"""
    match = re.search(r'(\d+(?:\.\d+)?)\s*s', desc)
    if match:
        return int(float(match.group(1)) * 1000)
    return 1000

# ============================================================
# 剧本解析器
# ============================================================

class ScriptElement:
    """剧本元素基类"""
    pass

class TTSElement(ScriptElement):
    """TTS朗读元素"""
    def __init__(self, role: str, emotion: str, rate: str, volume: str, text: str, line_num: int):
        self.role = role
        self.emotion = emotion
        self.rate = rate
        self.volume = volume
        self.text = text
        self.line_num = line_num

class SilenceElement(ScriptElement):
    """静音元素（PAUSE / ASMR / SFX / BGM 占位）"""
    def __init__(self, duration_ms: int, kind: str, desc: str, line_num: int):
        self.duration_ms = duration_ms
        self.kind = kind  # pause / asmr / sfx / bgm
        self.desc = desc
        self.line_num = line_num

def parse_script(filepath: str) -> List[ScriptElement]:
    """解析广播剧剧本"""
    elements = []
    current_text_lines = []
    current_meta = None
    in_metadata_section = False

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    def flush_text():
        nonlocal current_text_lines, current_meta
        if current_meta and current_text_lines:
            text = '\n'.join(current_text_lines).strip()
            if text:
                elements.append(TTSElement(
                    role=current_meta[0],
                    emotion=current_meta[1],
                    rate=current_meta[2],
                    volume=current_meta[3],
                    text=text,
                    line_num=current_meta[4]
                ))
        current_text_lines = []
        current_meta = None

    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()

        # 跳过空行
        if not line_stripped:
            if current_meta:
                current_text_lines.append('')
            continue

        # 跳过Markdown标题和分隔线
        if line_stripped.startswith('#') or line_stripped.startswith('---'):
            flush_text()
            continue

        # 跳过表格行和代码块
        if line_stripped.startswith('|') or line_stripped.startswith('```'):
            flush_text()
            continue

        # 到达制作备注部分，停止解析
        if '制作备注' in line_stripped:
            flush_text()
            break

        # 匹配 TTS 标签 [角色 | 情绪 | 语速 | 音量]
        tts_match = re.match(r'^\[([NMFYX])\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|\]]+)\]', line_stripped)
        if tts_match:
            flush_text()
            role = tts_match.group(1).strip()
            emotion = tts_match.group(2).strip()
            rate = tts_match.group(3).strip()
            volume = tts_match.group(4).strip()
            current_meta = (role, emotion, rate, volume, i)
            continue

        # 匹配 PAUSE 标记
        pause_match = re.match(r'^\[PAUSE:\s*([^\]]+)\]', line_stripped)
        if pause_match:
            flush_text()
            duration = parse_pause_ms(pause_match.group(1))
            elements.append(SilenceElement(duration, 'pause', pause_match.group(1), i))
            continue

        # 匹配 ASMR 标记
        asmr_match = re.match(r'^\[ASMR:\s*([^\]]+)\]', line_stripped)
        if asmr_match:
            flush_text()
            duration = parse_duration_ms(asmr_match.group(1))
            elements.append(SilenceElement(duration, 'asmr', asmr_match.group(1), i))
            continue

        # 匹配 SFX 标记
        sfx_match = re.match(r'^\[SFX:\s*([^\]]+)\]', line_stripped)
        if sfx_match:
            flush_text()
            duration = parse_duration_ms(sfx_match.group(1))
            if duration == 2000:  # 默认值，SFX通常短
                duration = 1000
            elements.append(SilenceElement(duration, 'sfx', sfx_match.group(1), i))
            continue

        # 匹配 BGM 标记
        bgm_match = re.match(r'^\[BGM:\s*([^\]]+)\]', line_stripped)
        if bgm_match:
            flush_text()
            elements.append(SilenceElement(3000, 'bgm', bgm_match.group(1), i))
            continue

        # 普通文本行（属于当前TTS块）
        if current_meta:
            current_text_lines.append(line_stripped)

    flush_text()
    return elements

# ============================================================
# TTS 生成器（通过Docker HTTP API）
# ============================================================

CACHE_DIR = Path(__file__).parent.parent.parent / '.cache' / 'tts'

def text_hash(text: str, voice: str, speed: float) -> str:
    content = f"{voice}|{speed}|{text}"
    return hashlib.md5(content.encode('utf-8')).hexdigest()

def call_tts_api(text: str, voice: str, speed: float) -> Optional[bytes]:
    """调用Docker Edge TTS HTTP API"""
    payload = json.dumps({
        "model": "tts-1",
        "input": text,
        "voice": voice,
        "response_format": "mp3",
        "speed": speed,
    }).encode('utf-8')

    req = urllib.request.Request(
        TTS_API_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TTS_API_KEY}",
        },
        method='POST',
    )

    # 绕过代理
    proxy_handler = urllib.request.ProxyHandler({})
    opener = urllib.request.build_opener(proxy_handler)

    try:
        with opener.open(req, timeout=30) as resp:
            if resp.status == 200:
                return resp.read()
            else:
                print(f"\n  API错误: HTTP {resp.status}")
                return None
    except urllib.error.URLError as e:
        print(f"\n  连接错误: {e}")
        return None
    except Exception as e:
        print(f"\n  未知错误: {e}")
        return None

def generate_tts(element: TTSElement, max_retries: int = 3) -> Tuple[Optional[AudioSegment], bool]:
    """
    生成单个TTS音频片段（带重试）
    返回: (音频片段, 是否成功)
    失败时返回 (静音占位, False)
    """
    voice = VOICE_MAP.get(element.role, VOICE_MAP["N"])
    speed = RATE_MAP.get(element.rate, 1.0)

    # 缓存检查
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    h = text_hash(element.text, voice, speed)
    cache_file = CACHE_DIR / f"{h}.mp3"

    if cache_file.exists() and cache_file.stat().st_size > 0:
        seg = mp3_to_audiosegment(str(cache_file))
        if seg:
            return seg, True

    # 调用 API（重试3次）
    audio_data = None
    last_error = ""
    for attempt in range(1, max_retries + 1):
        audio_data = call_tts_api(element.text, voice, speed)
        if audio_data:
            break
        last_error = f"第{attempt}次尝试失败"
        if attempt < max_retries:
            time.sleep(1.5 * attempt)  # 退避等待
            print(f"  [重试 {attempt+1}/{max_retries}]", end=' ', flush=True)

    # 失败处理：静音占位 + 记录日志
    if audio_data is None:
        reason = f"重试{max_retries}次后仍失败: {last_error}"
        log_failed_tts(element, voice, speed, reason)
        # 按文本长度估算静音时长（约3.5字/秒）
        est_duration_ms = max(2000, int(len(element.text) / 3.5 * 1000))
        return AudioSegment.silent(duration=est_duration_ms), False

    # 保存缓存
    with open(cache_file, 'wb') as f:
        f.write(audio_data)

    # 返回 AudioSegment
    seg = mp3_to_audiosegment(str(cache_file))
    if seg:
        return seg, True

    # mp3解析失败
    log_failed_tts(element, voice, speed, "mp3音频解析失败")
    est_duration_ms = max(2000, int(len(element.text) / 3.5 * 1000))
    return AudioSegment.silent(duration=est_duration_ms), False

# ============================================================
# 混音器
# ============================================================

def create_silence(duration_ms: int) -> AudioSegment:
    """创建静音片段"""
    return AudioSegment.silent(duration=duration_ms)

def apply_volume(seg: AudioSegment, volume_label: str) -> AudioSegment:
    """应用音量调整"""
    db = VOLUME_MAP.get(volume_label, 0)
    if db != 0:
        return seg + db
    return seg


# ============================================================
# 音效库匹配（从本地assets库加载）
# ============================================================

ASSETS_DIR = Path(__file__).parent / "assets"

# 音效关键词映射表：描述关键词 → 本地音效目录 + 文件名模式
SFX_KEYWORD_MAP = {
    # ASMR 女声类
    "女声低声喘息": ("asmr/female_breath", "female_breath_*.mp3"),
    "女声急促喘息": ("asmr/female_pant", "female_pant_*.mp3"),
    "女声断续喘息": ("asmr/female_pant", "female_pant_*.mp3"),
    "女声过度刺激喘息": ("asmr/female_pant", "female_pant_*.mp3"),
    "女声呻吟": ("asmr/female_moan", "female_moan_*.mp3"),
    "女声高昂呻吟": ("asmr/female_moan", "female_moan_*.mp3"),
    "女声短促惊叫": ("asmr/female_scream", "female_scream_*.mp3"),
    "女声尖叫": ("asmr/female_scream", "female_scream_*.mp3"),
    "女声潮吹尖叫": ("asmr/female_scream", "female_scream_*.mp3"),
    "女声无力轻笑": ("asmr/female_breath", "female_breath_*.mp3"),
    "女声微弱呼吸": ("asmr/female_breath", "female_breath_*.mp3"),
    # ASMR 拍打/摩擦类
    "皮肤拍打声": ("asmr/skin_slap", "slap_*.mp3"),
    "节奏性皮肤拍打声": ("asmr/skin_slap", "slap_slow_*.mp3"),
    "手指快速摩擦声": ("asmr/skin_slap", "slap_fast_*.mp3"),
    # SFX 环境类
    "引擎发动": ("sfx/engine", "engine_start_*.mp3"),
    "草原虫鸣": ("bgm/night_grassland", "crickets_*.mp3"),
    "草原环境底噪": ("bgm/night_grassland", "crickets_*.mp3"),
    "环境底噪": ("bgm/night_grassland", "crickets_*.mp3"),
    "虫鸣声": ("bgm/night_grassland", "crickets_*.mp3"),
    # BGM
    "夜晚草原": ("bgm/night_grassland", "crickets_*.mp3"),
    "低沉思辨型背景乐": ("bgm/contemplative", "heartbeat_*.mp3"),
}


def match_sfx(desc: str) -> Optional[Path]:
    """根据描述从本地音效库匹配音效文件"""
    for keyword, (subdir, pattern) in SFX_KEYWORD_MAP.items():
        if keyword in desc:
            sfx_dir = ASSETS_DIR / subdir
            if not sfx_dir.exists():
                continue
            # 用glob匹配文件
            files = sorted(sfx_dir.glob(pattern))
            if files:
                # 根据描述中的"加快/加剧/失控"选择对应版本
                if "加快" in desc or "加剧" in desc:
                    fast_files = [f for f in files if "fast" in f.name or "intense" in f.name]
                    if fast_files:
                        return random.choice(fast_files)
                if "渐强" in desc or "失控" in desc or "顶点" in desc:
                    intense_files = [f for f in files if "intense" in f.name]
                    if intense_files:
                        return random.choice(intense_files)
                return random.choice(files)
    return None


def load_sfx(desc: str, target_duration_ms: int) -> Optional[AudioSegment]:
    """加载并裁剪音效到指定时长"""
    sfx_file = match_sfx(desc)
    if not sfx_file:
        return None

    try:
        seg = mp3_to_audiosegment(str(sfx_file))
        if seg is None:
            return None

        # 循环或裁剪到目标时长
        target_ms = max(target_duration_ms, 500)
        if len(seg) < target_ms:
            # 循环延长
            loops = (target_ms // len(seg)) + 1
            seg = (seg * loops)[:target_ms]
        else:
            # 裁剪
            seg = seg[:target_ms]

        # 淡入淡出
        fade_ms = min(100, target_ms // 4)
        seg = seg.fade_in(fade_ms).fade_out(fade_ms)
        return seg
    except Exception as e:
        print(f"  音效加载失败 {sfx_file.name}: {e}")
        return None


def mix_elements(elements: List[ScriptElement], tts_segments: dict) -> Tuple[AudioSegment, dict]:
    """将所有元素按顺序拼接成最终音频，返回(音频, 统计信息)"""
    base_track = AudioSegment.silent(duration=0)
    stats = {"sfx_used": 0, "sfx_missed": 0, "tts_count": 0}

    for elem in elements:
        if isinstance(elem, TTSElement):
            seg = tts_segments.get(id(elem))
            if seg:
                # 应用音量调整
                seg = apply_volume(seg, elem.volume)
                # TTS片段前后各加150ms静音
                base_track += seg + AudioSegment.silent(duration=150)
                stats["tts_count"] += 1
            else:
                base_track += create_silence(500)
        elif isinstance(elem, SilenceElement):
            if elem.kind in ('asmr', 'sfx', 'bgm'):
                # 尝试从音效库匹配
                sfx_seg = load_sfx(elem.desc, elem.duration_ms)
                if sfx_seg:
                    base_track += sfx_seg
                    stats["sfx_used"] += 1
                else:
                    base_track += create_silence(elem.duration_ms)
                    stats["sfx_missed"] += 1
            else:
                base_track += create_silence(elem.duration_ms)

    return base_track, stats

# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='广播剧端到端生成')
    parser.add_argument('script', help='剧本文件路径')
    parser.add_argument('--output', '-o', default=None, help='输出文件路径')
    parser.add_argument('--no-cache', action='store_true', help='禁用TTS缓存')
    parser.add_argument('--preview', '-p', type=int, default=None, help='只生成前N个TTS片段（预览模式）')
    args = parser.parse_args()

    script_path = Path(args.script)
    if not script_path.exists():
        print(f"错误: 剧本文件不存在: {script_path}")
        sys.exit(1)

    # 输出路径
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = script_path.parent / 'output' / f"{script_path.stem}.mp3"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"{'='*60}")
    print(f"广播剧生成器")
    print(f"{'='*60}")
    print(f"剧本: {script_path}")
    print(f"输出: {output_path}")
    print(f"TTS API: {TTS_API_URL}")
    print(f"FFmpeg: {FFMPEG_PATH}")
    print()

    # 1. 解析剧本
    print("[1/4] 解析剧本...")
    elements = parse_script(str(script_path))

    tts_count = sum(1 for e in elements if isinstance(e, TTSElement))
    pause_count = sum(1 for e in elements if isinstance(e, SilenceElement) and e.kind == 'pause')
    asmr_count = sum(1 for e in elements if isinstance(e, SilenceElement) and e.kind == 'asmr')
    sfx_count = sum(1 for e in elements if isinstance(e, SilenceElement) and e.kind == 'sfx')
    bgm_count = sum(1 for e in elements if isinstance(e, SilenceElement) and e.kind == 'bgm')

    print(f"  TTS片段: {tts_count}")
    print(f"  PAUSE: {pause_count}")
    print(f"  ASMR: {asmr_count} (占位静音)")
    print(f"  SFX: {sfx_count} (占位静音)")
    print(f"  BGM: {bgm_count} (占位静音)")
    print()

    # 预览模式：只生成前N个
    if args.preview:
        tts_elements = [e for e in elements if isinstance(e, TTSElement)][:args.preview]
        print(f"  [预览模式] 只生成前 {args.preview} 个TTS片段")
    else:
        tts_elements = [e for e in elements if isinstance(e, TTSElement)]

    # 2. 生成TTS
    print(f"\n[2/4] 生成TTS人声 ({len(tts_elements)} 个片段)...")
    tts_segments = {}
    failed_count = 0

    for i, elem in enumerate(tts_elements, 1):
        preview = elem.text[:40].replace('\n', ' ')
        voice_name = VOICE_MAP.get(elem.role, "?")
        print(f"  [{i}/{len(tts_elements)}] [{elem.role}|{elem.emotion}] {preview}...", end=' ', flush=True)

        seg, success = generate_tts(elem)
        if seg:
            tts_segments[id(elem)] = seg
            if success:
                print(f"✓ ({len(seg)/1000:.1f}s)")
            else:
                failed_count += 1
                print(f"⚠ 静音占位 ({len(seg)/1000:.1f}s) 已记录日志")
        else:
            print("✗ 跳过")

    if failed_count > 0:
        print(f"\n  ⚠ {failed_count} 个片段失败，已用静音占位")
        print(f"  日志: {FAILED_LOG}")
        print(f"  修复后重跑即可（已成功的会走缓存）")

    print()

    # 3. 混音
    print("[3/4] 混音...")
    final_audio, stats = mix_elements(elements, tts_segments)
    print(f"  音效库命中: {stats['sfx_used']}/{stats['sfx_used']+stats['sfx_missed']}")
    if stats['sfx_missed'] > 0:
        print(f"  未匹配音效: {stats['sfx_missed']} 处（用静音占位）")
    duration_sec = len(final_audio) / 1000
    print(f"  总时长: {duration_sec:.1f}s ({int(duration_sec//60)}m {int(duration_sec%60)}s)")
    print()

    # 4. 导出（先导出wav，再用ffmpeg转mp3）
    print("[4/4] 导出音频...")
    wav_path = str(output_path).rsplit('.', 1)[0] + '.wav'
    final_audio.export(wav_path, format="wav")
    subprocess.run(
        [FFMPEG_PATH, '-y', '-i', wav_path, '-codec:a', 'libmp3lame', '-b:a', '192k', str(output_path)],
        capture_output=True, timeout=120
    )
    os.remove(wav_path)
    print(f"  ✓ 已保存: {output_path}")
    print()

    # 音效占位报告
    print(f"{'='*60}")
    print("音效占位报告（需后续接入音效库）:")
    print(f"{'='*60}")
    for elem in elements:
        if isinstance(elem, SilenceElement) and elem.kind != 'pause':
            kind_label = {"asmr": "ASMR", "sfx": "SFX ", "bgm": "BGM "}.get(elem.kind, "??? ")
            print(f"  行{elem.line_num:4d} [{kind_label}] {elem.duration_ms/1000:5.1f}s | {elem.desc}")

    print()
    print(f"完成! 总时长 {duration_sec:.1f}s")
    print(f"文件: {output_path}")

if __name__ == '__main__':
    main()
