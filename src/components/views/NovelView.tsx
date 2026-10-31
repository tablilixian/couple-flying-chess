import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Loader2, X, User, HeartHandshake, Grid3X3, Info, RotateCcw } from 'lucide-react';
import { NOVELS, Novel } from '../../data/novels';
import { CHARACTER_DB } from '../../data/novel/characterDB';

interface NovelViewProps {
  onExit: () => void;
}

interface Chapter {
  index: number;
  title: string;
  paragraphs: string[];
}

interface ChapterMeta {
  title: string;
}

/** 请求超时：弱网下宁可报错让用户重试，也不要无限转圈 */
async function fetchWithTimeout(url: string, timeout = 12000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`加载失败 (${res.status})`);
    return res;
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new Error('加载超时，请检查网络后重试');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeout = 12000): Promise<string> {
  const res = await fetchWithTimeout(url, timeout);
  return res.text();
}

async function fetchJson<T>(url: string, timeout = 12000): Promise<T> {
  const res = await fetchWithTimeout(url, timeout);
  return (await res.json()) as T;
}

/** 整本 md 的回退解析（分章文件缺失时才会用到） */
function parseChapters(raw: string): Chapter[] {
  const text = raw.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

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
      if (/^##/.test(trimmed)) continue;
      paragraphs.push(trimmed);
    }
    chapters.push({ index: i, title, paragraphs });
  }
  return chapters;
}

type Page = 'bookshelf' | 'detail' | 'reader';

export function NovelView({ onExit }: NovelViewProps) {
  const [page, setPage] = useState<Page>('bookshelf');
  const [selected, setSelected] = useState<Novel | null>(null);
  /** 章节目录元数据（来自 index.json，2~3KB，秒开） */
  const [chapterList, setChapterList] = useState<ChapterMeta[]>([]);
  /** 分章模式下的目录前缀；为 null 表示回退到整本 md 模式 */
  const [chapterBase, setChapterBase] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [curChapterIdx, setCurChapterIdx] = useState(0);
  const [detailTab, setDetailTab] = useState<'intro' | 'characters' | 'chapters'>('intro');

  /** 已加载的章节正文：序号 -> 段落 */
  const cacheRef = useRef<Map<number, string[]>>(new Map());
  /** 用来丢弃「快速翻页」时过期请求的回包 */
  const reqTokenRef = useRef(0);

  const resetBook = useCallback(() => {
    cacheRef.current.clear();
    reqTokenRef.current += 1;
    setChapterList([]);
    setChapterBase(null);
    setChapterLoading(false);
    setChapterError(null);
    setCurChapterIdx(0);
    setDetailTab('intro');
  }, []);

  /** 回退方案：分章文件缺失时整本下载（老行为，慢但能用） */
  const loadFullBook = useCallback(async (novel: Novel) => {
    const text = await fetchText(novel.src, 30000);
    const parsed = parseChapters(text);
    if (!parsed.length) throw new Error('这本小说还没有章节内容');
    cacheRef.current.clear();
    parsed.forEach((c, i) => cacheRef.current.set(i, c.paragraphs));
    setChapterList(parsed.map(c => ({ title: c.title })));
    setChapterBase(null);
  }, []);

  /** 拉目录（index.json），失败则回退整本 md */
  const loadCatalog = useCallback(async (novel: Novel) => {
    setLoading(true);
    setError(null);

    const base = `${import.meta.env.BASE_URL}novels/${novel.id}/`;
    try {
      const idx = await fetchJson<{ chapters?: ChapterMeta[] }>(`${base}index.json`, 10000);
      if (!idx?.chapters?.length) throw new Error('empty-index');
      setChapterList(idx.chapters.map(c => ({ title: c.title })));
      setChapterBase(base);
    } catch {
      // index.json 不存在（老数据 / 未执行拆分脚本）→ 退回整本 md
      try {
        await loadFullBook(novel);
      } catch (e) {
        setError((e as Error)?.message || '加载失败');
      }
    } finally {
      setLoading(false);
    }
  }, [loadFullBook]);

  const enterDetail = useCallback(async (novel: Novel) => {
    resetBook();
    setSelected(novel);
    setPage('detail');
    await loadCatalog(novel);
  }, [loadCatalog, resetBook]);

  /** 目录/正文加载失败后的重试：不切 Tab、不退出当前页 */
  const retryCatalog = useCallback(() => {
    if (selected) void loadCatalog(selected);
  }, [loadCatalog, selected]);

  /** 打开某一章：只按需拉这一章的正文 */
  const openChapter = useCallback(async (idx: number) => {
    if (idx < 0) return;
    setShowCatalog(false);
    setCurChapterIdx(idx);
    reqTokenRef.current += 1;
    const token = reqTokenRef.current;

    if (cacheRef.current.has(idx)) {
      setChapterLoading(false);
      setChapterError(null);
      return;
    }
    if (!chapterBase) return; // 整本模式：内容已全部在缓存里

    setChapterLoading(true);
    setChapterError(null);
    try {
      const data = await fetchJson<{ paragraphs?: string[] }>(
        `${chapterBase}ch/${String(idx + 1).padStart(2, '0')}.json`
      );
      cacheRef.current.set(idx, data.paragraphs || []);
    } catch (e) {
      if (token === reqTokenRef.current) setChapterError((e as Error)?.message || '本章加载失败');
    } finally {
      if (token === reqTokenRef.current) setChapterLoading(false);
    }
  }, [chapterBase]);

  const enterReader = useCallback((chapterIdx?: number) => {
    setPage('reader');
    void openChapter(chapterIdx ?? 0);
  }, [openChapter]);

  const backToDetail = useCallback(() => {
    setPage('detail');
  }, []);

  const backToBookshelf = useCallback(() => {
    setPage('bookshelf');
    setSelected(null);
    setError(null);
    resetBook();
  }, [resetBook]);

  const jumpTo = openChapter;

  const chapters = chapterList;
  const curParagraphs = cacheRef.current.get(curChapterIdx);
  const curTitle = chapters[curChapterIdx]?.title;

  // ===== 书房列表页 =====
  if (page === 'bookshelf') {
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
                  onClick={() => enterDetail(n)}
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

  // ===== 书籍详情页 =====
  if (page === 'detail' && selected) {
    const tabs = [
      { key: 'intro' as const, label: '简介', icon: <Info size={14} /> },
      { key: 'characters' as const, label: '人物', icon: <User size={14} /> },
      { key: 'chapters' as const, label: '目录', icon: <Grid3X3 size={14} /> },
    ];

    return (
      <div className="h-screen w-screen overflow-hidden flex justify-center bg-[#1a1612]">
        <div className="relative z-10 w-full h-full flex flex-col">
          <header className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-white/[0.06] bg-[#1a1612]/95 backdrop-blur">
            <button
              onClick={backToBookshelf}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="text-xs">书架</span>
            </button>
            <div className="flex-1 min-w-0 text-center">
              <div className="text-white text-sm font-medium truncate">{selected.title}</div>
              <div className="text-gray-500 text-[10px]">{selected.author}</div>
            </div>
            <div className="w-10 shrink-0" />
          </header>

          {/* Tab 栏 */}
          <div className="shrink-0 flex border-b border-white/[0.06] bg-[#1a1612]/80 backdrop-blur px-4">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setDetailTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                  detailTab === t.key
                    ? 'text-amber-400 border-amber-400'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* ===== 简介 Tab ===== */}
            {detailTab === 'intro' && (
              <div className="mx-auto max-w-3xl px-5 py-6 space-y-6">
                <div>
                  <h1 className="text-white text-xl font-bold leading-snug">{selected.title}</h1>
                  <p className="text-gray-400 text-xs mt-1">作者：{selected.author}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selected.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300/80 border border-amber-500/15">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <section>
                  <h3 className="text-amber-400/80 text-sm font-medium mb-2">简介</h3>
                  <p className="text-gray-300/80 text-[13px] leading-relaxed">{selected.description}</p>
                </section>

                {/* 快速入口卡片 */}
                <div className="grid grid-cols-2 gap-3">
                  {selected.characters && selected.characters.length > 0 && (
                    <button
                      onClick={() => setDetailTab('characters')}
                      className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                    >
                      <User size={20} className="text-amber-400/70" />
                      <span className="text-gray-300 text-xs">人物关系</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDetailTab('chapters')}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                  >
                    <Grid3X3 size={20} className="text-amber-400/70" />
                    <span className="text-gray-300 text-xs">章节目录</span>
                  </button>
                </div>

                {!loading && chapters.length > 0 && (
                  <button
                    onClick={() => enterReader(0)}
                    className="w-full py-3 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen size={16} />
                    开始阅读
                  </button>
                )}
              </div>
            )}

            {/* ===== 人物 Tab ===== */}
            {detailTab === 'characters' && (
              <CharactersTab
                novelId={selected.id}
                basicCharacters={selected.characters}
                basicRelations={selected.relations}
              />
            )}

            {/* ===== 目录 Tab ===== */}
            {detailTab === 'chapters' && (
              <div className="mx-auto max-w-3xl px-5 py-6 space-y-4">
                <h2 className="text-white text-base font-semibold flex items-center gap-2">
                  <Grid3X3 size={16} className="text-amber-400/70" />
                  章节目录
                  {chapters.length > 0 && (
                    <span className="text-gray-500 text-xs font-normal ml-1">共 {chapters.length} 章</span>
                  )}
                </h2>

                {loading && (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    <span className="text-xs">正在加载目录…</span>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="text-red-400/80 text-xs text-center">{error}</div>
                    <button
                      onClick={retryCatalog}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] transition-colors"
                    >
                      <RotateCcw size={13} />
                      重试
                    </button>
                  </div>
                )}

                {!loading && !error && chapters.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-10">暂无章节内容</p>
                )}

                {!loading && !error && chapters.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {chapters.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => enterReader(i)}
                        className="flex flex-col items-center justify-center px-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-amber-500/20 transition-colors text-center min-h-[56px]"
                      >
                        <span className="text-gray-500 text-[10px] leading-none mb-1">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-gray-300 text-[11px] leading-tight line-clamp-2">
                          {c.title.replace(/^第\s*\d+\s*章\s*/, '').trim() || c.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== 阅读页 =====
  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-[#1a1612]">
      <div className="relative z-10 w-full h-full flex flex-col">
        <header className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-white/[0.06] bg-[#1a1612]/95 backdrop-blur">
          <button
            onClick={backToDetail}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="text-xs">详情</span>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-white text-sm font-medium truncate">{selected?.title}</div>
            <div className="text-gray-500 text-[10px]">{selected?.author}</div>
          </div>
          <button
            onClick={() => setShowCatalog(v => !v)}
            disabled={chapters.length === 0}
            className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 shrink-0"
          >
            <span className="text-xs">目录</span>
            <ChevronDown size={16} />
          </button>
        </header>

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
                    key={i}
                    onClick={() => jumpTo(i)}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors border-b border-white/[0.03] ${
                      i === curChapterIdx
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

        <div className="flex-1 min-h-0 overflow-y-auto">
          {chapterLoading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Loader2 size={28} className="animate-spin mb-3" />
              <p className="text-xs">正在加载本章…</p>
            </div>
          )}
          {!chapterLoading && chapterError && (
            <div className="h-full flex flex-col items-center justify-center text-red-400/80 px-6">
              <p className="text-sm mb-3 text-center">{chapterError}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void openChapter(curChapterIdx)}
                  className="text-xs px-3 py-1.5 rounded bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  重试
                </button>
                <button
                  onClick={backToDetail}
                  className="text-xs px-3 py-1.5 rounded bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
                >
                  返回详情
                </button>
              </div>
            </div>
          )}
          {!chapterLoading && !chapterError && !curParagraphs && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
              <p className="text-xs">没有可显示的内容</p>
              <button
                onClick={backToDetail}
                className="text-xs px-3 py-1.5 rounded bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
              >
                返回详情
              </button>
            </div>
          )}
          {!chapterLoading && !chapterError && curParagraphs && (
            <article className="mx-auto max-w-3xl px-5 py-6">
              <div className="flex items-center justify-center gap-3 mb-6 text-[11px] text-gray-500">
                <button
                  onClick={() => jumpTo(curChapterIdx - 1)}
                  disabled={curChapterIdx === 0}
                  className="px-3 py-1.5 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  上一章
                </button>
                <span className="text-amber-400/80">
                  第 {curChapterIdx + 1} / {chapters.length} 章
                </span>
                <button
                  onClick={() => jumpTo(curChapterIdx + 1)}
                  disabled={curChapterIdx === chapters.length - 1}
                  className="px-3 py-1.5 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  下一章
                </button>
              </div>

              <section className="mb-10">
                <h2 className="text-amber-400/90 text-base font-semibold tracking-wide mb-3 pb-2 border-b border-amber-500/15">
                  {curTitle}
                </h2>
                <div className="space-y-2">
                  {curParagraphs.map((p, pi) => (
                    <p
                      key={pi}
                      className="text-gray-300/90 text-[13px] leading-[1.85] text-indent-[2em]"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>

              <div className="flex items-center justify-center gap-3 mt-8 mb-6 text-[11px] text-gray-500">
                <button
                  onClick={() => jumpTo(curChapterIdx - 1)}
                  disabled={curChapterIdx === 0}
                  className="px-3 py-1.5 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  上一章
                </button>
                <button
                  onClick={() => jumpTo(curChapterIdx + 1)}
                  disabled={curChapterIdx === chapters.length - 1}
                  className="px-3 py-1.5 rounded bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
                >
                  下一章
                </button>
              </div>

              {curChapterIdx === chapters.length - 1 && (
                <div className="text-center text-gray-600 text-[11px] pb-8">— 全书完 —</div>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 人物 Tab 子组件 =====
function CharactersTab({ novelId, basicCharacters, basicRelations }: {
  novelId: string;
  basicCharacters?: { name: string; role: string; description: string }[];
  basicRelations?: { from: string; to: string; relation: string }[];
}) {
  const db = novelId === 'xiangyinqi' ? CHARACTER_DB : null;

  // Use rich DB data if available
  if (db) {
    const chars = Object.values(db.characters);
    const roleOrder: Record<string, number> = { protagonist: 0, wife: 1, antagonist: 2, side: 3, minor: 4, lover: 5 };
    chars.sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));

    return (
      <div className="mx-auto max-w-3xl px-5 py-6 space-y-6">
        <h2 className="text-white text-base font-semibold flex items-center gap-2">
          <User size={16} className="text-amber-400/70" />
          主要人物
          <span className="text-gray-500 text-xs font-normal ml-1">共 {chars.length} 人</span>
        </h2>

        <div className="space-y-3">
          {chars.map(c => (
            <div key={c.id} className="bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{c.name}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-400/60 text-[10px]">{c.role}</span>
                    <span className="text-gray-600 text-[10px]">第{c.firstAppearChapter}-{c.lastAppearChapter}章</span>
                    <span className="text-gray-600 text-[10px]">{c.appearCount}次出场</span>
                  </div>
                </div>
                <div className="text-gray-600 text-[10px]">{c.gender === 'male' ? '♂' : '♀'}</div>
              </div>
              {c.aliases && c.aliases.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {c.aliases.map(a => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400 border border-white/[0.06]">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {c.tags && c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {c.tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/80 border border-amber-500/15">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-gray-300/80 text-[13px] leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>

        {db.relationships.length > 0 && (
          <>
            <h2 className="text-white text-base font-semibold flex items-center gap-2 pt-2">
              <HeartHandshake size={16} className="text-amber-400/70" />
              人物关系
              <span className="text-gray-500 text-xs font-normal ml-1">共 {db.relationships.length} 组</span>
            </h2>
            <div className="space-y-2">
              {db.relationships.map(r => {
                const from = db.characters[r.from]?.name || r.from;
                const to = db.characters[r.to]?.name || r.to;
                const typeLabels: Record<string, string> = {
                  spouse: '夫妻', lover: '情人', affair: '出轨', master_slave: '主奴',
                  friend: '朋友', colleague: '同事', family: '亲戚', enemy: '敌对',
                  blackmailer: '胁迫', voyeur: '窥视', other: '其他',
                };
                return (
                  <div key={r.id} className="bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.05] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{from}</span>
                      <span className="text-amber-400/50 text-[10px] px-2">{typeLabels[r.type] || r.type}</span>
                      <span className="text-white font-medium">{to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>强度: {'★'.repeat(r.intensity)}{'☆'.repeat(5 - r.intensity)}</span>
                      <span>|</span>
                      <span>第{r.startChapter}章开始</span>
                      {r.endChapter && <><span>|</span><span>第{r.endChapter}章结束</span></>}
                    </div>
                    {r.keyEvents.length > 0 && (
                      <details className="mt-1.5">
                        <summary className="text-gray-500 text-[10px] cursor-pointer hover:text-gray-300">
                          关键事件 ({r.keyEvents.length})
                        </summary>
                        <div className="mt-1 space-y-1">
                          {r.keyEvents.slice(0, 5).map((e, i) => (
                            <p key={i} className="text-gray-400 text-[10px] leading-relaxed">
                              <span className="text-gray-500">第{e.chapter}章</span> {e.summary}
                            </p>
                          ))}
                          {r.keyEvents.length > 5 && (
                            <p className="text-gray-600 text-[10px]">…还有 {r.keyEvents.length - 5} 条事件</p>
                          )}
                        </div>
                      </details>
                    )}
                    {r.notes && <p className="text-gray-600 text-[10px] mt-1">备注：{r.notes}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Fallback: use basic novel data
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 space-y-6">
      <h2 className="text-white text-base font-semibold flex items-center gap-2">
        <User size={16} className="text-amber-400/70" />
        主要人物
      </h2>
      {basicCharacters && basicCharacters.length > 0 ? (
        <div className="space-y-3">
          {basicCharacters.map((c, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{c.name}</div>
                  <div className="text-amber-400/60 text-[10px]">{c.role}</div>
                </div>
              </div>
              <p className="text-gray-300/80 text-[13px] leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-xs text-center py-8">暂无人物数据</p>
      )}
      {basicRelations && basicRelations.length > 0 && (
        <>
          <h2 className="text-white text-base font-semibold flex items-center gap-2 pt-2">
            <HeartHandshake size={16} className="text-amber-400/70" />
            人物关系
          </h2>
          <div className="space-y-2">
            {basicRelations.map((r, i) => (
              <div key={i} className="bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.05] flex items-center justify-between text-xs">
                <span className="text-white font-medium">{r.from}</span>
                <span className="text-amber-400/50 text-[10px] px-2">{r.relation}</span>
                <span className="text-white font-medium">{r.to}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
