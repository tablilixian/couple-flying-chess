import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Loader2, X } from 'lucide-react';
import { NOVELS, Novel } from '../../data/novels';

interface NovelViewProps {
  onExit: () => void;
}

interface Chapter {
  index: number;
  title: string;
  paragraphs: string[];
}

// 把整篇 md 文本按「##第XX章」切分成章节
function parseChapters(raw: string): Chapter[] {
  // 统一换行
  const text = raw.replace(/\r\n/g, '\n');
  // 提取首部元信息（标题/作者/标签），它们也以全角空格开头
  const lines = text.split('\n');

  // 找到所有章节起始行
  const chapterStarts: { line: number; title: string }[] = [];
  const chapterRegex = /^##\s*第\s*\d+\s*章/;
  lines.forEach((line, i) => {
    if (chapterRegex.test(line.trim())) {
      chapterStarts.push({ line: i, title: line.trim().replace(/^##\s*/, '') });
    }
  });

  const chapters: Chapter[] = [];
  for (let i = 0; i < chapterStarts.length; i++) {
    const start = chapterStarts[i].line;
    const end = i + 1 < chapterStarts.length ? chapterStarts[i + 1].line : lines.length;
    const title = chapterStarts[i].title;
    const paragraphs: string[] = [];
    for (let j = start + 1; j < end; j++) {
      const l = lines[j];
      const trimmed = l.trim();
      if (!trimmed) continue;
      // 跳过仍然是 md 标题或元信息的行
      if (/^##/.test(trimmed)) continue;
      paragraphs.push(trimmed);
    }
    chapters.push({ index: i, title, paragraphs });
  }
  return chapters;
}

export function NovelView({ onExit }: NovelViewProps) {
  const [selected, setSelected] = useState<Novel | null>(null);
  const [raw, setRaw] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 加载小说内容
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRaw('');
    fetch(selected.src)
      .then(res => {
        if (!res.ok) throw new Error(`加载失败 (${res.status})`);
        return res.text();
      })
      .then(text => {
        if (!cancelled) {
          setRaw(text);
          setLoading(false);
          setActiveChapter(0);
          // 滚动到顶部
          requestAnimationFrame(() => {
            contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
          });
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e?.message || '加载失败');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const chapters = useMemo(() => (raw ? parseChapters(raw) : []), [raw]);

  // 监听滚动，更新当前章节高亮
  useEffect(() => {
    if (!chapters.length) return;
    const el = contentRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrollTop = el.scrollTop;
      // 找到当前可视区顶部的章节
      let current = 0;
      for (let i = 0; i < sectionRefs.current.length; i++) {
        const s = sectionRefs.current[i];
        if (!s) continue;
        // 章节顶部相对内容容器的偏移
        const top = s.offsetTop - el.offsetTop;
        if (top - 80 <= scrollTop) {
          current = i;
        } else {
          break;
        }
      }
      setActiveChapter(current);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [chapters]);

  const jumpTo = (i: number) => {
    const s = sectionRefs.current[i];
    const el = contentRef.current;
    if (s && el) {
      const top = s.offsetTop - el.offsetTop - 8;
      el.scrollTo({ top, behavior: 'smooth' });
    }
    setShowCatalog(false);
  };

  // ===== 列表页 =====
  if (!selected) {
    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
        <div className="fixed inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 w-full max-w-[430px] h-full flex flex-col bg-black/20">
          <header className="pt-12 pb-3 px-6 shrink-0 flex items-center gap-3">
            <button
              onClick={onExit}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={20} />
              <span className="text-xs">退出</span>
            </button>
            <div className="flex-1" />
          </header>
          <div className="px-6 pb-2 shrink-0">
            <div className="flex items-center gap-2 text-amber-400/80">
              <BookOpen size={18} />
              <h1 className="text-xl font-semibold tracking-wide">书房</h1>
            </div>
            <p className="text-gray-500 text-xs mt-1">共 {NOVELS.length} 本</p>
          </div>
          <main className="flex-1 min-h-0 overflow-y-auto px-6 pb-10 pt-3">
            <div className="space-y-3">
              {NOVELS.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className="w-full text-left p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-base leading-snug">{n.title}</h3>
                      <p className="text-gray-500 text-xs mt-1">作者：{n.author}</p>
                    </div>
                    <BookOpen size={16} className="text-gray-600 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {n.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/80 border border-amber-500/15">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mt-2.5 line-clamp-3">{n.description}</p>
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ===== 阅读页 =====
  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-[#1a1612]">
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* 顶部栏 */}
        <header className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-white/[0.06] bg-[#1a1612]/95 backdrop-blur">
          <button
            onClick={() => setSelected(null)}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="text-xs">书架</span>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-white text-sm font-medium truncate">{selected.title}</div>
            <div className="text-gray-500 text-[10px]">{selected.author}</div>
          </div>
          <button
            onClick={() => setShowCatalog(v => !v)}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
          >
            <span className="text-xs">目录</span>
            <ChevronDown size={16} />
          </button>
        </header>

        {/* 章节目录抽屉 */}
        {showCatalog && (
          <div className="absolute inset-0 z-20" onClick={() => setShowCatalog(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute top-0 right-0 h-full w-[70%] max-w-[300px] bg-[#221d18] border-l border-white/[0.06] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 px-4 py-3 flex items-center justify-between bg-[#221d18] border-b border-white/[0.06]">
                <span className="text-white text-sm font-medium">目录</span>
                <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="py-1">
                {chapters.map((c, i) => (
                  <button
                    key={c.index}
                    onClick={() => jumpTo(i)}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors border-b border-white/[0.03] ${
                      i === activeChapter
                        ? 'text-amber-400 bg-amber-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-gray-600 mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 内容区 */}
        <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Loader2 size={28} className="animate-spin mb-3" />
              <p className="text-xs">正在加载小说内容…</p>
            </div>
          )}
          {error && (
            <div className="h-full flex flex-col items-center justify-center text-red-400/80 px-6">
              <p className="text-sm mb-3">{error}</p>
              <button
                onClick={() => setSelected(null)}
                className="text-xs px-3 py-1.5 rounded bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
              >
                返回书架
              </button>
            </div>
          )}
          {!loading && !error && chapters.length > 0 && (
            <article className="mx-auto max-w-3xl px-5 py-6">
              {/* 当前章节快速跳转条 */}
              <div className="flex items-center justify-center gap-3 mb-5 text-[11px] text-gray-500">
                <button
                  onClick={() => jumpTo(Math.max(0, activeChapter - 1))}
                  disabled={activeChapter === 0}
                  className="px-2.5 py-1 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  上一章
                </button>
                <span className="text-amber-400/80">
                  第 {activeChapter + 1} / {chapters.length} 章
                </span>
                <button
                  onClick={() => jumpTo(Math.min(chapters.length - 1, activeChapter + 1))}
                  disabled={activeChapter === chapters.length - 1}
                  className="px-2.5 py-1 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  下一章
                </button>
              </div>

              {chapters.map((c, i) => (
                <section
                  key={c.index}
                  ref={el => { sectionRefs.current[i] = el as HTMLDivElement | null; }}
                  className="mb-10 scroll-mt-16"
                >
                  <h2 className="text-amber-400/90 text-base font-semibold tracking-wide mb-3 pb-2 border-b border-amber-500/15">
                    {c.title}
                  </h2>
                  <div className="space-y-2">
                    {c.paragraphs.map((p, pi) => (
                      <p
                        key={pi}
                        className="text-gray-300/90 text-[13px] leading-[1.85] text-indent-[2em]"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {/* 底部章节导航 */}
              <div className="flex items-center justify-center gap-3 mt-8 mb-6 text-[11px] text-gray-500">
                <button
                  onClick={() => jumpTo(Math.max(0, activeChapter - 1))}
                  disabled={activeChapter === 0}
                  className="px-3 py-1.5 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  上一章
                </button>
                <button
                  onClick={() => jumpTo(Math.min(chapters.length - 1, activeChapter + 1))}
                  disabled={activeChapter === chapters.length - 1}
                  className="px-3 py-1.5 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  下一章
                </button>
              </div>
              <div className="text-center text-gray-600 text-[11px] pb-8">— 全书完 —</div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
