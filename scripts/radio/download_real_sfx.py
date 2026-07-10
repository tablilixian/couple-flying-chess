#!/usr/bin/env python3
"""
从 free-sound-effects.net 下载高质量真实人声音效，替换TTS生成的低质量ASMR音效。
许可：Royalty-free, commercial use, no sign-up required.
"""
import urllib.request
import shutil
import os
from pathlib import Path

ASSETS_DIR = Path(__file__).parent / "assets" / "asmr"

# 音效下载列表： (目标文件名, URL, 描述)
DOWNLOADS = {
    # ===== 女声喘息 (female_breath) =====
    "female_breath": [
        ("female_breath_01.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674784732.mp3", "gasp aaah female 2"),
        ("female_breath_02.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674784739.mp3", "gasp aaah female 3"),
        ("female_breath_03.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-A_FEMALE.mp3", "female voice A"),
        ("female_breath_04.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-O_FEMALE.mp3", "female voice O"),
    ],
    # ===== 女声急促喘息 (female_pant) =====
    "female_pant": [
        ("female_pant_01.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-H_FEMALE.mp3", "female voice H - panting"),
        ("female_pant_02.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-E_FEMALE.mp3", "female voice E - exhale"),
        ("female_pant_03.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-I_FEMALE.mp3", "female voice I - sharp"),
        ("female_pant_04.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-F_FEMALE.mp3", "female voice F - breath"),
    ],
    # ===== 女声呻吟 (female_moan) =====
    "female_moan": [
        ("female_moan_01.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-M_FEMALE.mp3", "female voice M - moan"),
        ("female_moan_02.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-L_FEMALE.mp3", "female voice L - low moan"),
        ("female_moan_03.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-N_FEMALE.mp3", "female voice N - nasal moan"),
        ("female_moan_04.mp3", "https://free-sound-effects.net/mp3/02/free-sound-effects-G_FEMALE.mp3", "female voice G - groan"),
        ("female_moan_05.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674763356.mp3", "creature human speak moan"),
    ],
    # ===== 女声尖叫 (female_scream) =====
    "female_scream": [
        ("female_scream_01.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674882837.mp3", "scream female kerri ahhh 2"),
        ("female_scream_02.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674882845.mp3", "scream female kerri ahhh shrill 2"),
        ("female_scream_03.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979345.mp3", "female scream 1"),
        ("female_scream_04.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979352.mp3", "female scream with echo"),
    ],
}


def download_file(url: str, dest: Path) -> bool:
    """下载文件到目标路径"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status != 200:
                print(f"  FAIL: HTTP {resp.status}")
                return False
            data = resp.read()
            if len(data) < 1000:
                print(f"  FAIL: File too small ({len(data)} bytes)")
                return False
            with open(dest, 'wb') as f:
                f.write(data)
            print(f"  OK: {len(data)} bytes")
            return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


def backup_existing(dir_path: Path):
    """备份现有文件到 .tts_backup 子目录"""
    backup_dir = dir_path / ".tts_backup"
    backup_dir.mkdir(exist_ok=True)
    for f in dir_path.glob("*.mp3"):
        shutil.copy2(f, backup_dir / f.name)
        print(f"  Backup: {f.name}")


def main():
    print("=" * 60)
    print("下载高质量真实人声音效，替换TTS生成的低质量ASMR")
    print("来源: free-sound-effects.net (Royalty-free, commercial OK)")
    print("=" * 60)

    total_ok = 0
    total_fail = 0

    for category, files in DOWNLOADS.items():
        target_dir = ASSETS_DIR / category
        print(f"\n[{category}] 目标: {target_dir}")

        if not target_dir.exists():
            target_dir.mkdir(parents=True)
            print(f"  Created directory")
        else:
            print(f"  Backing up existing TTS files...")
            backup_existing(target_dir)

        for filename, url, desc in files:
            dest = target_dir / filename
            print(f"  Downloading: {filename} ({desc})...")
            if download_file(url, dest):
                total_ok += 1
            else:
                total_fail += 1

    print(f"\n{'=' * 60}")
    print(f"完成! 成功: {total_ok}, 失败: {total_fail}")
    print(f"旧TTS文件已备份到各目录的 .tts_backup/ 子目录")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
