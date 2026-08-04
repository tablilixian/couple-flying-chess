#!/bin/bash
# 将目录内所有 mp3 重编码为低码率单声道(24kbps/16kHz)，原文件用 .bak_orig.mp3 备份。
set -u
DIR="${1:?用法: $0 <目录>}"
BR="${BR:-24k}"
AR="${AR:-16000}"
[ -d "$DIR" ] || { echo "目录不存在: $DIR"; exit 1; }

count=0
while IFS= read -r -d '' f; do
  [[ "$f" == *.bak_orig.mp3 ]] && continue   # 跳过备份文件
  bak="${f%.mp3}.bak_orig.mp3"
  [ -e "$bak" ] && continue   # 已处理过则跳过
  mv "$f" "$bak"
  if ffmpeg -nostdin -v error -y -i "$bak" -codec:a libmp3lame -b:a "$BR" -ar "$AR" -ac 1 "$f"; then
    count=$((count+1))
  else
    mv "$bak" "$f"   # 失败回滚
    echo "FAILED: $f"
  fi
done < <(find "$DIR" -type f -name "*.mp3" -print0)

echo "完成，共压缩 $count 个文件于 $DIR"