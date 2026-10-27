import { Discover, MyListening, Records, Settings, ChapterSummary } from "./LibraryScreens"
import { discoveryEpisodes, readStored, validHistory, validFavorites, type ListeningRecord } from "./libraryData"
import AiListening from "./AiListening"
import { type CSSProperties, useEffect, useRef, useState } from "react"

type Screen = "home" | "loading" | "results" | "player" | "ai" | "discover" | "mine" | "records"
type Conditions = { text: string; moods: string[]; duration: string }
type Episode = {
  id: string
  title: string
  source: string
  category: string
  cover: string
  reason: string
  length: string
}

const moods = ["想松口气", "有点低落", "脑子停不下"]
const durations = ["不限", "10分钟", "20分钟", "30分钟", "60分钟"]
const groups: Episode[][] = [
  [
    {
      id: "career",
      title: "初入职场，也可以慢慢来",
      source: "Vol.42",
      category: "TALK SHOW",
      cover: "/assets/bf0bd.png",
      reason: "换个角度理解职场里的不确定，给自己一点成长的空间。",
      length: "38分钟",
    },
    {
      id: "space",
      title: "忙碌生活里，给自己留一点空间",
      source: "日谈公园",
      category: "生活方式",
      cover: "/assets/af8f2.png",
      reason: "从日常故事里慢下来，给忙碌的生活留一点喘息的空间。",
      length: "52分钟",
    },
  ],
  [
    {
      id: "rest",
      title: "休息了，为什么还是觉得累？",
      source: "日谈公园",
      category: "身心休息",
      cover: "/assets/24894.png",
      reason: "看见疲惫背后的原因，允许自己暂时放慢一点。",
      length: "45分钟",
    },
    {
      id: "problem",
      title: "怎么把困惑变成一个好问题？",
      source: "声东击西",
      category: "成长",
      cover: "/assets/98d6f.png",
      reason: "用新的提问方式，帮你整理脑海里停不下来的念头。",
      length: "36分钟",
    },
  ],
]

const catalog = [...groups.flat(), ...discoveryEpisodes]

const initialConditions: Conditions = { text: "", moods: [], duration: "不限" }

function getTotalDuration(episode: Episode | null, mode: "clip" | "full") {
  return mode === "clip" ? 45 : Math.max(45, (parseInt(episode?.length || "2", 10) || 2) * 60)
}

function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value))
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`
}

function StatusBar() {
  return <div className="status-bar" aria-label="状态栏">
    <span>9:41</span>
    <svg width="68" height="16" viewBox="0 0 68 16" fill="none" aria-hidden="true">
      <g fill="currentColor"><rect x="1" y="10" width="3" height="4" rx=".6"/><rect x="6" y="7" width="3" height="7" rx=".6"/><rect x="11" y="4" width="3" height="10" rx=".6"/><rect x="16" y="1" width="3" height="13" rx=".6"/></g>
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M25 5c5-5 11-5 16 0M28 8c3-3 7-3 10 0M31 11c1-1 3-1 4 0"/></g><circle cx="33" cy="13" r="1" fill="currentColor"/>
      <rect x="47" y="3" width="18" height="10" rx="2.5" stroke="currentColor"/><rect x="49" y="5" width="14" height="6" rx="1" fill="currentColor"/><path d="M67 6v4" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  </div>
}

export default function App() {
  const [previewScale, setPreviewScale] = useState(() => Math.min(1, Math.max(1, window.innerHeight - 32) / 812))
  useEffect(() => {
    const resize = () => setPreviewScale(Math.min(1, Math.max(1, window.innerHeight - 32) / 812))
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  const [screen, setScreen] = useState<Screen>("home")
  const [aiReturn, setAiReturn] = useState<Screen>("player")
  const [playerReturn, setPlayerReturn] = useState<Screen>("home")
  const [recordTab, setRecordTab] = useState<"history" | "favorites">("history")
  const [history, setHistory] = useState<ListeningRecord[]>(() => readStored("moodcast.history.v1", [], validHistory))
  const [favorites, setFavorites] = useState<string[]>(() => readStored("moodcast.favorites.v1", [], validFavorites))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [summaryEpisode, setSummaryEpisode] = useState<Episode | null>(null)
  const excludedHistory = useRef<string[]>([])
  const [conditions, setConditions] = useState(initialConditions)
  const [draft, setDraft] = useState(initialConditions)
  const [durationOpen, setDurationOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [group, setGroup] = useState(0)
  const [current, setCurrent] = useState<Episode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mode, setMode] = useState<"clip" | "full">("clip")
  const [toast, setToast] = useState("")
  const [ended, setEnded] = useState(false)
  const durationRef = useRef<HTMLDivElement>(null)

  useEffect(() => { try { localStorage.setItem("moodcast.history.v1", JSON.stringify(history)) } catch {} }, [history])
  useEffect(() => { try { localStorage.setItem("moodcast.favorites.v1", JSON.stringify(favorites)) } catch {} }, [favorites])
  const totalDuration = getTotalDuration(current, mode)
  useEffect(() => {
    if (!playing || !current || excludedHistory.current.includes(current.id)) return
    setHistory(previous => [{id:current.id, progress:Math.floor(progress), total:totalDuration, mode, at:Date.now()}, ...previous.filter(r => r.id !== current.id)].slice(0,50))
  }, [current?.id, Math.floor(progress), mode, totalDuration, playing])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setProgress(value => Math.min(totalDuration, value + 0.25))
    }, 250)
    return () => window.clearInterval(timer)
  }, [playing, totalDuration])

  useEffect(() => {
    if (playing && progress >= totalDuration) {
      setPlaying(false)
      setEnded(mode === "clip")
    }
  }, [playing, progress, totalDuration, mode])

  useEffect(() => {
    if (!durationOpen) return
    const close = (event: PointerEvent) => {
      if (!durationRef.current?.contains(event.target as Node))
        setDurationOpen(false)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [durationOpen])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [adjustOpen])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const toggleMood = (
    mood: string,
    target = conditions,
    setter = setConditions,
  ) => {
    if (target.moods.includes(mood)) {
      setter({ ...target, moods: target.moods.filter((item) => item !== mood) })
    } else if (target.moods.length < 2) {
      setter({ ...target, moods: [...target.moods, mood] })
    } else {
      setToast("最多选择2项感受")
    }
  }

  const recommend = (next = conditions) => {
    setConditions(next)
    setScreen("loading")
    setAdjustOpen(false)
    window.setTimeout(() => setScreen("results"), 1000)
  }

  const chooseEpisode = (episode: Episode, navigate = false) => {
    excludedHistory.current = excludedHistory.current.filter(id => id !== episode.id)
    if (current?.id === episode.id) {
      if (progress >= totalDuration) { setProgress(0); setEnded(false) }
      setPlaying((value) => !value)
    } else {
      setCurrent(episode)
      setProgress(0)
      setMode("clip")
      setEnded(false)
      setPlaying(true)
    }
    if (navigate) { setPlayerReturn(screen); setScreen("player") }
  }

  const resumeRecord = (record: ListeningRecord) => {
    const episode = catalog.find(e => e.id === record.id)
    if (!episode) return
    excludedHistory.current = excludedHistory.current.filter(id => id !== episode.id)
    setCurrent(episode); setMode(record.mode); setProgress(record.progress >= record.total ? 0 : record.progress); setEnded(false); setPlaying(true)
    setPlayerReturn(screen); setScreen("player")
  }
  const toggleFavorite = () => { if(current) setFavorites(ids => ids.includes(current.id) ? ids.filter(id => id !== current.id) : [current.id,...ids]) }
  return (
    <main className={`app-shell${adjustOpen ? " has-modal" : ""}${screen === "ai" ? " is-ai" : ""}`} style={{"--preview-scale":previewScale} as CSSProperties}>
      <StatusBar />
      {screen === "home" && (
        <Home
          conditions={conditions}
          setConditions={setConditions}
          durationOpen={durationOpen}
          setDurationOpen={setDurationOpen}
          durationRef={durationRef}
          toggleMood={toggleMood}
          recommend={() => recommend()}
          onPlay={(episode) => chooseEpisode(episode)}
        />
      )}
      {screen === "discover" && <Discover onPlay={episode => chooseEpisode(episode)} onSummary={setSummaryEpisode} />}
      {screen === "mine" && <MyListening history={history} catalog={catalog} onResume={resumeRecord} onDiscover={() => setScreen("discover")} onRecords={tab => {setRecordTab(tab);setScreen("records")}} onSettings={() => setSettingsOpen(true)} />}
      {screen === "records" && <Records tab={recordTab} onTab={setRecordTab} history={history} favorites={favorites} catalog={catalog} onResume={resumeRecord} onPlay={episode => chooseEpisode(episode,true)} onRemove={id => {if(recordTab === "history") {excludedHistory.current.push(id);setHistory(items => items.filter(r => r.id !== id))} else setFavorites(ids => ids.filter(value => value !== id))}} onBack={() => setScreen("mine")} onDiscover={() => setScreen("discover")} />}
      {screen === "loading" && (
        <Loading conditions={conditions} onAdjust={() => setScreen("home")} />
      )}
      {screen === "results" && (
        <Results
          conditions={conditions}
          episodes={groups[group]}
          current={current}
          playing={playing}
          onBack={() => setScreen("home")}
          onAdjust={() => {
            setDraft({ ...conditions, moods: [...conditions.moods] })
            setAdjustOpen(true)
          }}
          onShuffle={() => {
            setScreen("loading")
            window.setTimeout(() => {
              setGroup((value) => (value + 1) % groups.length)
              setScreen("results")
            }, 650)
          }}
          onPlay={(episode) => chooseEpisode(episode)}
          onSummary={(episode) => { if(current?.id !== episode.id) {setCurrent(episode);setPlaying(false);setProgress(0);setMode("clip");setEnded(false)} setAiReturn("results");setScreen("ai") }}
        />
      )}
      {screen === "player" && (
        <Player
          episode={current || groups[0][1]}
          playing={playing}
          progress={progress}
          total={totalDuration}
          mode={mode}
          ended={ended}
          onBack={() => setScreen(playerReturn)}
          onToggle={() => {
            if (ended) {
              setProgress(0)
              setEnded(false)
            }
            setPlaying((value) => !value)
          }}
          onSeek={(value) => {
            setProgress(value)
            setEnded(false)
          }}
          onSkip={(amount) =>
            setProgress((value) =>
              Math.max(0, Math.min(totalDuration, value + amount)),
            )
          }
          onReplay={() => {
            setProgress(0)
            setEnded(false)
            setPlaying(true)
          }}
          onFull={() => {
            setMode("full")
            setProgress(0)
            setEnded(false)
            setPlaying(true)
          }}
          favorite={!!current && favorites.includes(current.id)}
          onFavorite={toggleFavorite}
          onAi={() => {setAiReturn("player");setScreen("ai")}}
          notify={setToast}
        />
      )}
      {screen === "ai" && current && <AiListening episode={current} progress={progress} playing={playing} onBack={() => setScreen(aiReturn)} onSeek={(value) => {setMode("full");setProgress(value);setEnded(false);setPlaying(true)}} />}

      {screen !== "player" && (
        <MiniPlayer
          episode={current}
          playing={playing}
          progress={progress}
          total={totalDuration}
          onToggle={() => {
            if (!current) return
            if (progress >= totalDuration) { setProgress(0); setEnded(false) }
            setPlaying((value) => !value)
          }}
          onOpen={() => { if (current) { setPlayerReturn(screen); setScreen("player") } }}
          notify={setToast}
        />
      )}
      {screen !== "player" && screen !== "ai" && <BottomNav active={screen === "discover" ? "discover" : screen === "mine" || screen === "records" ? "mine" : "home"} onNavigate={setScreen} />}
      {adjustOpen && (
        <AdjustModal
          draft={draft}
          setDraft={setDraft}
          toggleMood={(mood) => toggleMood(mood, draft, setDraft)}
          onClose={() => setAdjustOpen(false)}
          onConfirm={() => recommend(draft)}
        />
      )}
      {summaryEpisode && <ChapterSummary episode={summaryEpisode} onClose={() => setSummaryEpisode(null)} onPlay={() => {chooseEpisode(summaryEpisode);setSummaryEpisode(null)}} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} onClearHistory={() => {excludedHistory.current = current ? [current.id] : [];setHistory([])}} onClearAll={() => {setPlaying(false);setCurrent(null);setProgress(0);setHistory([]);setFavorites([]);setEnded(false)}} />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}

function Home({
  conditions,
  setConditions,
  durationOpen,
  setDurationOpen,
  durationRef,
  toggleMood,
  recommend,
  onPlay,
}: {
  conditions: Conditions
  setConditions: (value: Conditions) => void
  durationOpen: boolean
  setDurationOpen: (value: boolean) => void
  durationRef: React.RefObject<HTMLDivElement | null>
  toggleMood: (mood: string) => void
  recommend: () => void
  onPlay: (episode: Episode) => void
}) {
  const enabled = Boolean(conditions.text.trim() || conditions.moods.length)
  const homeEpisodes: Episode[] = [
    { ...groups[1][0], cover: "/assets/24894.png" },
    { ...groups[1][1], cover: "/assets/98d6f.png", source: "日谈公园" },
  ]
  return (
    <div className="home-screen screen-scroll">
      <img className="home-background" src="/assets/b318e.png" alt="" />
      <header className="brand-row">
        <strong>MOODCAST</strong>
        <span>听见此刻，听懂更多</span>
      </header>
      <h1>此刻，你想听些什么？</h1>
      <section className="prompt-card">
        <div className="prompt-title">
          <span className="ai-decoration">
            <img src="/assets/dfda4.png" alt="" />
          </span>
          想听点什么~
        </div>
        <div className="input-box">
          <textarea
            maxLength={300}
            value={conditions.text}
            onChange={(event) =>
              setConditions({ ...conditions, text: event.target.value })
            }
            placeholder="例如：想听轻松一点的职场故事"
          />
          <div className="input-meta">
            <span>{conditions.text.length} / 300</span>
            <div ref={durationRef} className="duration-wrap">
              <button onClick={() => setDurationOpen(!durationOpen)}>
                {conditions.duration === "不限" ? "时长" : conditions.duration}
                <img src="/assets/14654.svg" alt="" />
              </button>
              {durationOpen && (
                <div className="duration-menu">
                  {durations.map((duration) => (
                    <button
                      className={
                        duration === conditions.duration ? "selected" : ""
                      }
                      key={duration}
                      onClick={() => {
                        setConditions({ ...conditions, duration })
                        setDurationOpen(false)
                      }}
                    >
                      <span>
                        {duration === "不限"
                          ? duration
                          : duration.replace("分钟", " 分钟")}
                      </span>
                      {duration === conditions.duration && (
                        <svg
                          className="duration-check"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mood-head">
          <span>还没想好？选个感受</span>
          <span>
            {conditions.moods.length
              ? `已选 ${conditions.moods.length} / 2`
              : "最多选 2 个"}
          </span>
        </div>
        <div className="moods">
          {moods.map((mood, index) => (
            <button
              className={conditions.moods.includes(mood) ? "active" : ""}
              key={mood}
              onClick={() => toggleMood(mood)}
            >
              <img
                src={
                  [
                    "/assets/56c6e.svg",
                    "/assets/42ce8.svg",
                    "/assets/6be1d.svg",
                  ][index]
                }
                alt=""
              />
              {mood}
            </button>
          ))}
        </div>
        <button
          className="recommend-button"
          disabled={!enabled}
          onClick={recommend}
        >
          <img src="/assets/0ad89.svg" alt="" />
          为我推荐
        </button>
      </section>
      <div className="privacy">
        <span>输入用于本次 AI 推荐，请勿填写敏感个人信息。</span>
        <button>数据说明</button>
      </div>
      <section className="home-list">
        <h2>
          为你推荐的专属声音
          <button>
            <img src="/assets/01a2f.svg" alt="" />
          </button>
        </h2>
        <HomeItem
          image="/assets/24894.png"
          title="休息了，为什么还是觉得累？"
          detail="AI 选段：换个角度理解「有效休息」"
          meta="45 秒试听 · 日谈公园"
          onPlay={() => onPlay(homeEpisodes[0])}
        />
        <HomeItem
          image="/assets/98d6f.png"
          title="怎么把困惑变成一个好问题？"
          detail="AI 选段：在不确定的时期，如何和自己对话"
          meta="45 秒试听 · 日谈公园"
          onPlay={() => onPlay(homeEpisodes[1])}
        />
      </section>
    </div>
  )
}

function HomeItem({
  image,
  title,
  detail,
  meta,
  onPlay,
}: {
  image: string
  title: string
  detail: string
  meta: string
  onPlay: () => void
}) {
  return (
    <div className="home-item">
      <img src={image} alt="" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
        <small>{meta}</small>
      </div>
      <button className="home-play" onClick={onPlay} aria-label={`试听：${title}`}>
        <img src="/assets/cc7aa.svg" alt="" />
      </button>
    </div>
  )
}

function PageHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="page-header">
      <button onClick={onBack} aria-label="返回"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      <strong>{title}</strong>
      <span />
    </header>
  )
}

function Loading({
  conditions,
  onAdjust,
}: {
  conditions: Conditions
  onAdjust: () => void
}) {
  return (
    <div className="result-screen">
      <PageHeader onBack={onAdjust} title="为此刻推荐" />
      <div className="condition-summary">
        <span>你想听</span>
        <button onClick={onAdjust}>调整 ›</button>
        <strong>{conditions.text || conditions.moods.join("、")}</strong>
      </div>
      <div className="loading-center">
        <i />
        <p>正在整理适合此刻的声音…</p>
      </div>
    </div>
  )
}

function Results({
  conditions,
  episodes,
  current,
  playing,
  onBack,
  onAdjust,
  onShuffle,
  onPlay,
  onSummary,
}: {
  conditions: Conditions
  episodes: Episode[]
  current: Episode | null
  playing: boolean
  onBack: () => void
  onAdjust: () => void
  onShuffle: () => void
  onPlay: (episode: Episode) => void
  onSummary: (episode: Episode) => void
}) {
  return (
    <div className="result-screen screen-scroll">
      <PageHeader onBack={onBack} title="为此刻推荐" />
      <div className="condition-summary">
        <span>你想听</span>
        <button onClick={onAdjust}>调整 ›</button>
        <strong>
          “
          {conditions.text ||
            conditions.moods.join("、") ||
            "想听轻松一点的职场故事"}
          ”
        </strong>
      </div>
      <div className="result-title">
        <h2>为你精选</h2>
        <button onClick={onShuffle}>换一组<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.6 8a7 7 0 0 1 11.5-3L20 8M4 16l2.9 3A7 7 0 0 0 18.4 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <div className="cards">
        {episodes.map((episode) => (
          <article className="episode-card" key={episode.id}>
            <div className="episode-main">
              <img src={episode.cover} alt="" />
              <div className="episode-copy">
                <h3>{episode.title}</h3>
                <p>
                  <b>{episode.category}</b><span>{episode.source}</span>
                </p>
              </div>
              <button className="round-play" onClick={() => onPlay(episode)} aria-label={current?.id === episode.id && playing ? "暂停" : "播放"}>
                <img
                  src={
                    current?.id === episode.id && playing
                      ? "/assets/card-pause.svg"
                      : "/assets/8f670.svg"
                  }
                  alt=""
                />
              </button>
            </div>
            <div className="reason">
              <small>为什么推荐</small>
              <p>{episode.reason}</p>
            </div>
            <div className="card-foot">
              <span>试听45秒 · 全长{episode.length}</span>
              <button onClick={() => onSummary(episode)}>查看摘要 ›</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function MiniPlayer({
  episode,
  playing,
  progress,
  total,
  onToggle,
  onOpen,
  notify,
}: {
  episode: Episode | null
  playing: boolean
  progress: number
  total: number
  onToggle: () => void
  onOpen: () => void
  notify: (value: string) => void
}) {
  return (
    <div className="mini-player">
      <button className="mini-info" onClick={onOpen}>
        {episode ? (
          <img className="mini-cover" src={episode.cover} alt="" />
        ) : (
          <span className="mini-placeholder">
            <img src="/assets/ca261.svg" alt="" />
          </span>
        )}
        <span>
          <strong>{episode?.title || "还没有选择播客"}</strong>
          <small>
            {episode
              ? `${
                  playing ? "播放中" : "暂停"
                } · ${formatTime(progress)} / ${formatTime(total)}`
              : "选一段声音，从这里开始"}
          </small>
        </span>
      </button>
      <button className="mini-control" onClick={onToggle} disabled={!episode} aria-label={playing ? "暂停" : "播放"}>
        <img src={playing ? "/assets/card-pause.svg" : "/assets/e5808.svg"} alt="" />
      </button>
      <button
        className="playlist"
        onClick={() => notify("节目单将在下一阶段接入")}
      >
        <img src="/assets/5a721.svg" alt="" />
      </button>
    </div>
  )
}

function BottomNav({active,onNavigate}:{active:"home"|"discover"|"mine";onNavigate:(screen:Screen)=>void}) {
  return <nav className="bottom-nav" aria-label="主导航">{([{id:"home",label:"此刻",icon:"2eb85.svg"},{id:"discover",label:"发现",icon:"1c415.svg"},{id:"mine",label:"我的",icon:"096c5.svg"}] as const).map(item => <button key={item.id} className={active===item.id?"active":""} aria-current={active===item.id?"page":undefined} onClick={() => onNavigate(item.id)}><img src={"/assets/"+item.icon} alt=""/>{item.label}</button>)}</nav>
}

function AdjustModal({
  draft,
  setDraft,
  toggleMood,
  onClose,
  onConfirm,
}: {
  draft: Conditions
  setDraft: (value: Conditions) => void
  toggleMood: (mood: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="modal-shade"
      onPointerDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <section className="adjust-modal">
        <header>
          <h2>调整推荐</h2>
          <button onClick={onClose}>×</button>
        </header>
        <label>
          收听目的
          <select>
            <option>不限</option>
            <option>放松</option>
            <option>获得启发</option>
          </select>
        </label>
        <label>
          内容偏好
          <select>
            <option>不限</option>
            <option>故事</option>
            <option>知识</option>
          </select>
        </label>
        <div className="adjust-group">
          <p>
            不想听的主题　<small>最多 3 个</small>
          </p>
          <div className="topic-row">
            {["生活", "成长", "职场", "文化", "科技"].map((item) => (
              <button key={item}>▣ {item}</button>
            ))}
          </div>
        </div>
        <label>
          想听什么
          <textarea
            value={draft.text}
            maxLength={300}
            onChange={(event) =>
              setDraft({ ...draft, text: event.target.value })
            }
          />
        </label>
        <div className="adjust-group">
          <p>当下感受</p>
          <div className="topic-row">
            {moods.map((mood) => (
              <button
                className={draft.moods.includes(mood) ? "picked" : ""}
                key={mood}
                onClick={() => toggleMood(mood)}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
        <label>
          可用时间
          <select
            value={draft.duration}
            onChange={(event) =>
              setDraft({ ...draft, duration: event.target.value })
            }
          >
            {durations.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <p className="modal-note">
          当前素材为几分钟的试听音频；时间为偏好展示。
        </p>
        <button className="update-button" onClick={onConfirm}>
          更新推荐
        </button>
      </section>
    </div>
  )
}

function Player({
  episode,
  playing,
  progress,
  total,
  mode,
  ended,
  onBack,
  onToggle,
  onSeek,
  onSkip,
  onReplay,
  onFull,
  onAi,
  favorite,
  onFavorite,
  notify,
}: {
  episode: Episode
  playing: boolean
  progress: number
  total: number
  mode: "clip" | "full"
  ended: boolean
  onBack: () => void
  onToggle: () => void
  onSeek: (value: number) => void
  onSkip: (amount: number) => void
  onReplay: () => void
  onFull: () => void
  onAi: () => void
  favorite: boolean
  onFavorite: () => void
  notify: (value: string) => void
}) {
  return (
    <div className="player-screen">
      <header className="player-top">
        <button className="player-icon-button" onClick={onBack} aria-label="返回">
          <img src="/assets/49e68.svg" alt="" />
        </button>
        <div className="player-mode">
          <b>收听</b>
          <button onClick={onAi}>
            <img src="/assets/11bb2.svg" alt="" />
            AI 精听
          </button>
        </div>
        <button
          className={`player-icon-button${favorite ? " is-favorite" : ""}`}
          onClick={onFavorite}
          aria-label={favorite ? "取消收藏" : "收藏"}
          aria-pressed={favorite}
        >
          <img src="/assets/94d05.svg" alt="" />
        </button>
      </header>
      <div className="player-media">
        <img className="player-cover" src={episode.cover} alt="" />
        <div className="player-copy">
          <h1>{episode.title}</h1>
          <p>{episode.source} · 示例单集</p>
        </div>
      </div>
      <div className="clip-copy">
        <strong>{mode === "clip" ? "正在试听推荐片段" : "正在收听整期"}</strong>
        <p>{episode.title} · AI 选段示例 · 00:00—00:45</p>
      </div>
      <div className="seek">
        <input
          type="range"
          min="0"
          max={total}
          step=".25"
          value={progress}
          style={
            {
              "--player-progress": `${(progress / total) * 100}%`,
            } as CSSProperties
          }
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div>
          <span>{formatTime(progress)}</span>
          <span>{formatTime(total)}</span>
        </div>
      </div>
      <div className="player-actions">
        <div className="player-controls">
          <button className="skip-button" onClick={() => onSkip(-15)}>
            <img src="/assets/b4b16.svg" alt="" />
            <small>15</small>
          </button>
          <button className="main-play" onClick={onToggle} aria-label={playing ? "暂停" : "播放"}>
            <img src={playing ? "/assets/player-pause.svg" : "/assets/80350.svg"} alt="" />
          </button>
          <button className="skip-button" onClick={() => onSkip(15)}>
            <img src="/assets/216a1.svg" alt="" />
            <small>15</small>
          </button>
        </div>
        <div className="player-tools">
          <button onClick={() => notify("倍速切换将在下一阶段接入")}>1 x</button>
          <button onClick={() => notify("节目单将在下一阶段接入")} aria-label="节目单">
            <img src="/assets/60751.svg" alt="" />
          </button>
        </div>
      </div>
      {ended && (
        <div className="ended-actions">
          <p>试听片段已结束</p>
          <button onClick={onReplay}>再听一次</button>
          <button onClick={onFull}>继续听整期</button>
        </div>
      )}
      <p className="player-note">演示内容 · 当前音频为模拟播放</p>
    </div>
  )
}
