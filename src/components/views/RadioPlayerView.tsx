import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { GameMode } from '../../types';

interface RadioChapter {
  id: string;
  chapter: string;
  title: string;
  desc: string;
  file: string;
  duration: number;
  tags: string[];
}

interface RadioPlayerViewProps {
  mode: GameMode;
  onBack: () => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RadioPlayerView({ mode, onBack }: RadioPlayerViewProps) {
  const accentColor = mode === 'couple' ? '#FF375F' : '#0A84FF';
  const [chapters, setChapters] = useState<RadioChapter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 加载manifest
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}audio/radio/manifest.json`)
      .then(r => {
        if (!r.ok) throw new Error('manifest加载失败');
        return r.json();
      })
      .then((data: RadioChapter[]) => {
        setChapters(data);
        if (data.length > 0) setDuration(data[0].duration);
      })
      .catch(e => setLoadError(e.message));
  }, []);

  const currentChapter = chapters[currentIndex];

  // 音频事件绑定
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter) return;

    const onLoadedMeta = () => {
      setDuration(audio.duration || currentChapter.duration);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      // 自动播放下一章
      if (currentIndex < chapters.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentChapter, currentIndex, chapters.length]);

  // 切换章节时重新加载
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter) return;
    audio.src = `${import.meta.env.BASE_URL}audio/radio/${currentChapter.file}`;
    audio.load();
    setCurrentTime(0);
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // 音量/倍速同步
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
      audioRef.current.playbackRate = speed;
    }
  }, [volume, muted, speed]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setIsPlaying(false));
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const prevChapter = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsPlaying(true);
    }
  };

  const nextChapter = () => {
    if (currentIndex < chapters.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsPlaying(true);
    }
  };

  const selectChapter = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      {/* 背景 */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accentColor}33 0%, transparent 60%),
                        radial-gradient(ellipse at 50% 100%, #BF5AF215 0%, transparent 50%)`
          }}
        />
      </div>

      {/* 顶部栏 */}
      <div className="relative z-10 flex items-center gap-3 px-6 pt-12 pb-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="text-[11px] font-semibold tracking-widest" style={{ color: accentColor }}>
            📻 RADIO DRAMA
          </div>
          <h1 className="text-xl font-bold text-white">广播剧</h1>
        </div>
      </div>

      {/* 加载中/错误 */}
      {loadError && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-4xl mb-3">📡</div>
            <div className="text-gray-400 text-sm">音效库加载失败</div>
            <div className="text-gray-600 text-xs mt-1">{loadError}</div>
          </div>
        </div>
      )}

      {!loadError && chapters.length === 0 && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-pulse">📻</div>
            <div className="text-gray-400 text-sm">加载中...</div>
          </div>
        </div>
      )}

      {/* 主体内容 */}
      {!loadError && chapters.length > 0 && (
        <>
          {/* 播放器卡片 */}
          {currentChapter && (
            <div className="relative z-10 mx-6 mb-4 rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                       border: `1px solid ${accentColor}33` }}>
              {/* 封面区 */}
              <div className="relative h-32 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accentColor}22, #00000044)` }}>
                <div className="text-5xl"
                  style={{ filter: isPlaying ? 'drop-shadow(0 0 12px ' + accentColor + ')' : 'none' }}>
                  📻
                </div>
                {isPlaying && (
                  <div className="absolute bottom-3 right-3 flex items-end gap-0.5 h-4">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="w-0.5 rounded-full animate-pulse"
                        style={{ height: '100%', background: accentColor,
                                 animationDelay: `${i * 0.15}s`,
                                 animationDuration: '0.8s' }} />
                    ))}
                  </div>
                )}
              </div>

              {/* 章节信息 */}
              <div className="p-4">
                <div className="text-[11px] font-semibold tracking-widest mb-1"
                  style={{ color: accentColor }}>
                  {currentChapter.chapter}
                </div>
                <div className="text-white text-base font-bold mb-1">{currentChapter.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed line-clamp-2">{currentChapter.desc}</div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentChapter.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: `${accentColor}22`, color: accentColor }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 进度条 */}
              <div className="px-4 pb-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={seek}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-white"
                  style={{
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${progress}%, rgba(255,255,255,0.15) ${progress}%, rgba(255,255,255,0.15) 100%)`
                  }}
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 控制栏 */}
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-2 w-24">
                  <button
                    onClick={() => { setMuted(!muted); }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                    className="flex-1 h-1 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-2.5
                               [&::-webkit-slider-thumb]:h-2.5
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-white"
                    style={{ background: `linear-gradient(to right, white 0%, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) 100%)` }}
                  />
                </div>

                <div className="flex items-center gap-5">
                  <button
                    onClick={prevChapter}
                    disabled={currentIndex === 0}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    <SkipBack size={20} fill="currentColor" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95"
                    style={{ background: accentColor }}
                  >
                    {isPlaying ? (
                      <Pause size={22} className="text-white" fill="currentColor" />
                    ) : (
                      <Play size={22} className="text-white ml-0.5" fill="currentColor" />
                    )}
                  </button>

                  <button
                    onClick={nextChapter}
                    disabled={currentIndex >= chapters.length - 1}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    <SkipForward size={20} fill="currentColor" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const idx = SPEED_OPTIONS.indexOf(speed);
                    setSpeed(SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-xs font-semibold w-10"
                >
                  {speed}x
                </button>
              </div>
            </div>
          )}

          {/* 章节列表 */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <div className="text-xs font-semibold text-gray-500 tracking-widest mb-3">
              全部章节 ({chapters.length})
            </div>
            <div className="space-y-2">
              {chapters.map((ch, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={ch.id}
                    onClick={() => selectChapter(idx)}
                    className={`w-full text-left rounded-xl p-3 transition-all border ${
                      isActive
                        ? 'bg-white/[0.08]'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05]'
                    }`}
                    style={isActive ? { borderColor: `${accentColor}66` } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: isActive ? accentColor : 'rgba(255,255,255,0.08)' }}>
                        {isActive && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-0.5 bg-white rounded-full animate-pulse"
                                style={{ height: '100%', animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-white">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {ch.chapter} · {ch.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{ch.desc}</div>
                      </div>
                      <div className="text-xs text-gray-600 shrink-0">
                        {formatTime(ch.duration)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center text-[11px] text-gray-600 mt-6">
              广播剧由 Edge TTS + ASMR 音效库自动合成
            </div>
          </div>
        </>
      )}

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
