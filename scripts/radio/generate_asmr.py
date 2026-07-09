"""
ASMR音效库生成器
利用现有TTS服务合成非语言人声音效（喘息/呻吟/尖叫等）
利用程序生成环境音（白噪音/粉噪音/节奏拍打）

使用：
    python3 scripts/radio/generate_asmr.py
"""
import json
import os
import random
import urllib.request
import urllib.error
from pathlib import Path
from pydub import AudioSegment
from pydub.generators import WhiteNoise, Sine
import imageio_ffmpeg

# 复用主脚本的配置
FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = FFMPEG_PATH
TTS_API_URL = "http://localhost:5050/v1/audio/speech"
TTS_API_KEY = "your_api_key_here"

ASSETS_DIR = Path("scripts/radio/assets")


def call_tts(text: str, voice: str, speed: float = 1.0) -> bytes:
    """调用TTS API"""
    payload = json.dumps({
        "model": "tts-1", "input": text, "voice": voice,
        "response_format": "mp3", "speed": speed
    }).encode('utf-8')
    req = urllib.request.Request(
        TTS_API_URL, data=payload,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {TTS_API_KEY}"},
        method='POST'
    )
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(req, timeout=30) as resp:
        return resp.read()


def save_audio(data: bytes, path: Path):
    """保存mp3"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'wb') as f:
        f.write(data)
    print(f"  ✓ {path}")


def mp3_to_segment(mp3_path: Path) -> AudioSegment:
    """mp3转AudioSegment（绕过ffprobe）"""
    import subprocess
    wav_path = str(mp3_path).rsplit('.', 1)[0] + '.wav'
    subprocess.run(
        [FFMPEG_PATH, '-y', '-i', str(mp3_path), '-f', 'wav',
         '-acodec', 'pcm_s16le', '-ar', '24000', '-ac', '1', wav_path],
        capture_output=True, timeout=30
    )
    seg = AudioSegment.from_wav(wav_path)
    os.remove(wav_path)
    return seg


# ============================================================
# 1. TTS合成：女声ASMR（喘息/呻吟/尖叫）
# ============================================================

FEMALE_VOICE = "zh-CN-XiaoyiNeural"

# 用感叹词模拟ASMR音效
FEMALE_ASMR_PHRASES = {
    "female_breath": [  # 轻喘息
        ("啊...", 0.85),
        ("嗯...哈...", 0.8),
        ("呼...嗯...", 0.85),
        ("哈...啊...", 0.9),
    ],
    "female_pant": [  # 急促喘息
        ("哈！哈！哈！哈！", 1.3),
        ("啊！啊！嗯！哈！", 1.2),
        ("呼！哈！呼！哈！", 1.4),
        ("啊...哈！哈！哈！", 1.25),
    ],
    "female_moan": [  # 呻吟
        ("嗯嗯...啊...", 0.75),
        ("啊...嗯...嗯...", 0.7),
        ("嗯...啊...深一点...", 0.8),
        ("啊...好舒服...嗯...", 0.75),
        ("嗯啊...啊...嗯...", 0.7),
    ],
    "female_scream": [  # 尖叫
        ("啊！！！", 1.1),
        ("啊啊啊！！！", 1.15),
        ("嗯啊！！哈！", 1.1),
        ("啊！不要！啊！", 1.1),
    ],
}


def generate_female_asmr():
    """生成女声ASMR音效"""
    print("\n[1/3] 生成女声ASMR音效...")
    for category, phrases in FEMALE_ASMR_PHRASES.items():
        out_dir = ASSETS_DIR / "asmr" / category
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n  生成 {category} ({len(phrases)} 个变体):")
        for i, (text, speed) in enumerate(phrases, 1):
            out_file = out_dir / f"{category}_{i:02d}.mp3"
            if out_file.exists():
                print(f"    跳过(已存在): {out_file.name}")
                continue
            try:
                data = call_tts(text, FEMALE_VOICE, speed)
                # 降低音量并添加柔和效果
                save_audio(data, out_file)
                # 后处理：降低音量到-6dB，让ASMR更柔和
                seg = mp3_to_segment(out_file)
                seg = seg - 6  # 降6dB
                # 导出
                wav_tmp = str(out_file).rsplit('.', 1)[0] + '_proc.wav'
                seg.export(wav_tmp, format="wav")
                import subprocess
                subprocess.run(
                    [FFMPEG_PATH, '-y', '-i', wav_tmp, '-codec:a', 'libmp3lame',
                     '-b:a', '192k', str(out_file)],
                    capture_output=True, timeout=30
                )
                os.remove(wav_tmp)
            except Exception as e:
                print(f"    ✗ {text}: {e}")


# ============================================================
# 2. 程序生成：皮肤拍打声（节奏性）
# ============================================================

def generate_skin_slap(duration_sec: float, tempo_bpm: int = 90) -> AudioSegment:
    """
    生成节奏性皮肤拍打声
    用低频脉冲+短促白噪音模拟
    """
    beat_interval = int(60000 / tempo_bpm)  # ms per beat
    total_ms = int(duration_sec * 1000)
    track = AudioSegment.silent(duration=total_ms)

    # 每个拍打 = 短促低频脉冲 + 短促白噪音
    for t in range(0, total_ms, beat_interval):
        # 低频脉冲（"啪"的冲击）
        pulse = Sine(80).to_audio_segment(duration=30).apply_gain(-3)
        # 短促白噪音（皮肤摩擦质感）
        noise = WhiteNoise().to_audio_segment(duration=40).apply_gain(-15)
        # 叠加
        slap = pulse.overlay(noise)
        # 快速衰减
        slap = slap.fade_out(30)
        track = track.overlay(slap, position=t)

    return track


def generate_skin_slaps():
    """生成多种节奏的皮肤拍打音效"""
    print("\n[2/3] 生成皮肤拍打声...")
    out_dir = ASSETS_DIR / "asmr" / "skin_slap"
    out_dir.mkdir(parents=True, exist_ok=True)

    configs = [
        ("slow_90bpm_8s", 8.0, 90),
        ("medium_110bpm_8s", 8.0, 110),
        ("fast_130bpm_10s", 10.0, 130),
        ("intense_150bpm_5s", 5.0, 150),
        ("single_slap", 0.1, 60),
    ]

    for name, dur, bpm in configs:
        out_file = out_dir / f"slap_{name}.mp3"
        if out_file.exists():
            print(f"  跳过: {out_file.name}")
            continue
        print(f"  生成: {name} ({dur}s @ {bpm}bpm)")
        seg = generate_skin_slap(dur, bpm)
        wav_tmp = str(out_file).rsplit('.', 1)[0] + '.wav'
        seg.export(wav_tmp, format="wav")
        import subprocess
        subprocess.run(
            [FFMPEG_PATH, '-y', '-i', wav_tmp, '-codec:a', 'libmp3lame',
             '-b:a', '192k', str(out_file)],
            capture_output=True, timeout=30
        )
        os.remove(wav_tmp)
        print(f"    ✓ {out_file}")


# ============================================================
# 3. 程序生成：环境音（虫鸣/引擎/心跳）
# ============================================================

def generate_night_crickets(duration_sec: float = 60.0) -> AudioSegment:
    """生成夜晚虫鸣（草原氛围）"""
    total_ms = int(duration_sec * 1000)
    track = AudioSegment.silent(duration=total_ms)

    # 底层：低音量粉噪音（环境底噪）
    base_noise = WhiteNoise().to_audio_segment(duration=total_ms).apply_gain(-30)

    # 虫鸣：高频短促脉冲，随机分布
    random.seed(42)
    for _ in range(int(duration_sec * 4)):  # 每秒约4次虫鸣
        t = random.randint(0, total_ms - 100)
        # 4-6kHz的短促脉冲
        freq = random.choice([4000, 4500, 5000, 5500, 6000])
        chirp = Sine(freq).to_audio_segment(duration=30).apply_gain(-12)
        chirp = chirp.fade_in(5).fade_out(25)
        track = track.overlay(chirp, position=t)

    return track.overlay(base_noise)


def generate_engine_start(duration_sec: float = 3.0) -> AudioSegment:
    """生成引擎启动声（低频渐强）"""
    total_ms = int(duration_sec * 1000)
    # 低频正弦 + 噪音
    engine = Sine(60).to_audio_segment(duration=total_ms).apply_gain(-8)
    noise = WhiteNoise().to_audio_segment(duration=total_ms).apply_gain(-20)
    # 渐强
    result = engine.overlay(noise)
    result = result.fade_in(500).fade_out(300)
    return result


def generate_heartbeat(duration_sec: float = 10.0, bpm: int = 70) -> AudioSegment:
    """生成心跳声"""
    beat_interval = int(60000 / bpm)
    total_ms = int(duration_sec * 1000)
    track = AudioSegment.silent(duration=total_ms)

    for t in range(0, total_ms, beat_interval):
        # "咚" - 低频脉冲
        beat1 = Sine(50).to_audio_segment(duration=80).apply_gain(-6).fade_out(60)
        # "哒" - 稍高频
        beat2 = Sine(70).to_audio_segment(duration=60).apply_gain(-12).fade_out(40)
        track = track.overlay(beat1, position=t)
        track = track.overlay(beat2, position=t + 120)

    return track


def generate_environment_sfx():
    """生成环境音效"""
    print("\n[3/3] 生成环境音效...")
    import subprocess

    # 虫鸣（夜晚草原BGM）
    out_file = ASSETS_DIR / "bgm" / "night_grassland" / "crickets_60s.mp3"
    if not out_file.exists():
        print(f"  生成: 夜晚虫鸣 60s")
        seg = generate_night_crickets(60.0)
        wav_tmp = str(out_file).rsplit('.', 1)[0] + '.wav'
        seg.export(wav_tmp, format="wav")
        subprocess.run(
            [FFMPEG_PATH, '-y', '-i', wav_tmp, '-codec:a', 'libmp3lame',
             '-b:a', '128k', str(out_file)],
            capture_output=True, timeout=60
        )
        os.remove(wav_tmp)
        print(f"    ✓ {out_file}")

    # 引擎启动
    out_file = ASSETS_DIR / "sfx" / "engine" / "engine_start_3s.mp3"
    if not out_file.exists():
        print(f"  生成: 引擎启动 3s")
        seg = generate_engine_start(3.0)
        wav_tmp = str(out_file).rsplit('.', 1)[0] + '.wav'
        seg.export(wav_tmp, format="wav")
        subprocess.run(
            [FFMPEG_PATH, '-y', '-i', wav_tmp, '-codec:a', 'libmp3lame',
             '-b:a', '192k', str(out_file)],
            capture_output=True, timeout=30
        )
        os.remove(wav_tmp)
        print(f"    ✓ {out_file}")

    # 心跳（用于紧张场景BGM）
    out_file = ASSETS_DIR / "bgm" / "contemplative" / "heartbeat_70bpm_10s.mp3"
    if not out_file.exists():
        print(f"  生成: 心跳 70bpm 10s")
        seg = generate_heartbeat(10.0, 70)
        wav_tmp = str(out_file).rsplit('.', 1)[0] + '.wav'
        seg.export(wav_tmp, format="wav")
        subprocess.run(
            [FFMPEG_PATH, '-y', '-i', wav_tmp, '-codec:a', 'libmp3lame',
             '-b:a', '192k', str(out_file)],
            capture_output=True, timeout=30
        )
        os.remove(wav_tmp)
        print(f"    ✓ {out_file}")


# ============================================================
# 主流程
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("ASMR音效库生成器")
    print("=" * 60)

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    generate_female_asmr()
    generate_skin_slaps()
    generate_environment_sfx()

    print("\n" + "=" * 60)
    print("完成！音效库结构:")
    print("=" * 60)
    for root, dirs, files in os.walk(ASSETS_DIR):
        level = root.replace(str(ASSETS_DIR), '').count(os.sep)
        indent = '  ' * level
        print(f"{indent}{os.path.basename(root)}/")
        for f in files:
            size = os.path.getsize(os.path.join(root, f)) // 1024
            print(f"{indent}  {f} ({size}KB)")
