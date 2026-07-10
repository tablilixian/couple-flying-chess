#!/usr/bin/env python3
"""
下载更高质量的真实女声音效（来自 free-sound-effects.net 的 sex/moan/sigh 分类）
替换之前太短的单字母发音音效。
许可：Royalty-free, commercial use, no sign-up required.
"""
import urllib.request
from pathlib import Path

ASSETS_DIR = Path(__file__).parent / "assets" / "asmr"

# 更高质量的真实女声音效
DOWNLOADS = {
    # ===== 女声喘息 (female_breath) - 用 sigh female 替换 =====
    "female_breath": [
        ("female_breath_01.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979381.mp3", "female sigh 1"),
        ("female_breath_02.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979388.mp3", "female sigh 2"),
        ("female_breath_03.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979396.mp3", "female sigh 3"),
        ("female_breath_04.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674889109.mp3", "sigh female 1"),
        ("female_breath_05.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675118827.mp3", "sigh female 4"),
        ("female_breath_06.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675118835.mp3", "sigh female 6"),
    ],
    # ===== 女声急促喘息 (female_pant) - 用 gasp 和 human moan 替换 =====
    "female_pant": [
        ("female_pant_01.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674784732.mp3", "gasp aaah female 2"),
        ("female_pant_02.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674784739.mp3", "gasp aaah female 3"),
        ("female_pant_03.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675035863.mp3", "human moan 2504"),
        ("female_pant_04.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675035870.mp3", "human moan 367"),
        ("female_pant_05.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675035877.mp3", "human moan 368"),
        ("female_pant_06.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674883509.mp3", "sexy girl coo giggle"),
    ],
    # ===== 女声呻吟 (female_moan) - 用 sexy girl moaning 替换 =====
    "female_moan": [
        ("female_moan_01.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674883479.mp3", "sexy girl moaning collection"),
        ("female_moan_02.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674883471.mp3", "sexy girl moaning 03"),
        ("female_moan_03.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674883463.mp3", "sex groaning woman with delay 01"),
        ("female_moan_04.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675015547.mp3", "groan female 01"),
        ("female_moan_05.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675015555.mp3", "groan female 02"),
        ("female_moan_06.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675035884.mp3", "human moan 369"),
        ("female_moan_07.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675035892.mp3", "human moan 370"),
    ],
    # ===== 女声尖叫 (female_scream) - 保持现有的，已经很合适 =====
    "female_scream": [
        ("female_scream_01.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674882837.mp3", "scream female kerri ahhh 2"),
        ("female_scream_02.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674882845.mp3", "scream female kerri ahhh shrill 2"),
        ("female_scream_03.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979345.mp3", "female scream 1"),
        ("female_scream_04.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1674979352.mp3", "female scream with echo"),
        ("female_scream_05.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675111286.mp3", "scream female giving birth"),
        ("female_scream_06.mp3", "https://free-sound-effects.net/mp3/03/free-sound-1675111293.mp3", "scream female horror 1"),
    ],
}


def download_file(url: str, dest: Path) -> bool:
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


def main():
    print("=" * 60)
    print("下载高质量真实女声音效（sex/moan/sigh 分类）")
    print("=" * 60)

    total_ok = 0
    total_fail = 0

    for category, files in DOWNLOADS.items():
        target_dir = ASSETS_DIR / category
        print(f"\n[{category}]")

        if not target_dir.exists():
            target_dir.mkdir(parents=True)

        for filename, url, desc in files:
            dest = target_dir / filename
            print(f"  {filename} ({desc})...")
            if download_file(url, dest):
                total_ok += 1
            else:
                total_fail += 1

    print(f"\n{'=' * 60}")
    print(f"完成! 成功: {total_ok}, 失败: {total_fail}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
