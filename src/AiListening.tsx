import { useEffect, useRef, useState } from "react"

type ChatTurn = { id: number; question: string; answer: string | null }

type Episode = { id: string; title: string; source: string; cover: string; length: string }
const chapters = ["开场：把注意力放回自己", "在不确定中找到小目标", "从一件具体的小事开始", "给自己的节奏一点耐心"]
const transcript = ["刚开始一件新事时，我们总觉得应该马上懂得所有事情。", "后来才发现，不确定并不代表你做得不好，它只是经验还在积累。", "把模糊的自我怀疑，拆成一个今天可以解决的小问题。", "给自己的节奏一点耐心，慢慢走也是往前走。"]
const questions = ["为什么休息了，还是觉得累？", "下班后，可以先试着做什么？", "如何给每天留出30分钟放空空间？"]
const answers = ["先察觉自己是否把放松也当成了一项需要完成的任务。休息不只是停止工作，也包括暂时放下“必须有产出”的要求。", "先从一件不需要交代成果的小事开始。\n留出属于自己的空间，不必急着要求自己有所产出。\n下班后，选一件很小的事做一会儿，再观察自己的感受。", "先为自己保留一段不用交代成果的时间。可以从一件具体的小事开始，再慢慢找到适合自己的节奏。"]
const stamp = (n: number) => `${Math.floor(n / 60).toString().padStart(2,"0")}:${(n % 60).toString().padStart(2,"0")}`
export default function AiListening({episode,progress,playing,onBack,onSeek}:{episode:Episode;progress:number;playing:boolean;onBack:()=>void;onSeek:(time:number)=>void}) {
 const [tab,setTab]=useState(0)
 const [range,setRange]=useState("整期")
 const [input,setInput]=useState("")
 const [turns,setTurns]=useState<ChatTurn[]>([])
 const pending=turns.some(turn=>turn.answer===null)
 const nextTurnId=useRef(0)
 const followLatest=useRef(true)
 const [chapterMenu,setChapterMenu]=useState(false)
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null)
 const messages=useRef<HTMLDivElement>(null)
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[])
 useEffect(()=>{setTab(0);setTurns([]);setInput("");followLatest.current=true;if(timer.current)clearTimeout(timer.current);timer.current=null},[episode.id])
 useEffect(()=>{if(tab===2&&followLatest.current)messages.current?.scrollTo({top:messages.current.scrollHeight,behavior:"instant"})},[turns,tab])
 const ask=(value:string)=>{
  const question=value.trim()
  if(!question||pending||timer.current)return
  const id=nextTurnId.current++
  followLatest.current=true
  setTurns(previous=>[...previous,{id,question,answer:null}])
  setInput("")
  timer.current=setTimeout(()=>{setTurns(previous=>previous.map(turn=>turn.id===id?{...turn,answer:answers[Math.max(0,questions.indexOf(question))]}:turn));timer.current=null},1100)
 }
 const active=Math.min(3,Math.floor(progress/30))
 return <section className={`ai-screen ai-tab-${tab}`} aria-label="AI 智能精听">
  <div className="ai-reading">
   <header className="ai-ambience">
    <nav className="ai-navbar"><button onClick={onBack} aria-label="返回收听"><img src="/assets/ai-back.svg" alt=""/></button><h1>AI 智能精听</h1><span>MOODCAST</span></nav>
    <div className="ai-episode"><img src={episode.cover} alt={episode.title}/><div><h2>{episode.title}</h2><p>{episode.source} ›</p><div className="ai-tags"><span>{episode.length}</span><span>示例单集</span></div></div></div>
   </header>
   <main className="ai-board">
    <div className="ai-tabs" role="tablist" aria-label="精听内容">{["摘要与章节","逐字稿","问答"].map((name,i)=><button key={name} id={`ai-tab-${i}`} role="tab" aria-selected={tab===i} aria-controls="ai-panel" onClick={()=>setTab(i)}>{name}</button>)}</div>
    <div id="ai-panel" role="tabpanel" aria-labelledby={`ai-tab-${tab}`}>
    {tab===0&&<div className="ai-summary-content">
     <article className="ai-summary"><header><h2><img src="/assets/ai-spark.svg" alt=""/>AI 精听摘要</h2><select aria-label="选择精听范围" value={range} onChange={e=>setRange(e.target.value)}><option>整期</option><option>当前选段</option></select></header>
      <p className="ai-lead">{range==="整期"?<>休息不只是停止工作，也包括<strong>暂时放下“必须有产出”</strong>的要求。</>:<>先从一件不需要交代成果的小事开始，<strong>留出属于自己的空间。</strong></>}</p>
      <div className="ai-takeaways"><small>这期你会听到</small><ul><li>为什么空下来，仍然觉得疲惫</li><li>区分身体休息与心理放松</li><li>一个下班后可以尝试的小行动</li></ul></div>
      <button className="ai-ask-link" onClick={()=>setTab(2)}>问问 AI，怎么用在我的生活里？<img src="/assets/ai-next.svg" alt=""/></button>
     </article>
     <section className="ai-insights"><header><h2>关键观点与原声</h2><small>2条</small></header><p>点击片段，试听演示音频</p>{["休息也不必追求效率","给自己一个没有目标的片刻"].map((title,i)=><article key={title}><h3>{title}</h3><p>{i===0?"先察觉自己是否把放松也当成了一项需要完成的任务。":"从一件不需要交代成果的小事开始，留出属于自己的空间。"}</p><footer><button onClick={()=>onSeek((i+1)*30)}><img src="/assets/ai-play.svg" alt=""/>试听演示音频</button><small>{stamp((i+1)*30)}</small></footer></article>)}</section>
     <section className="ai-chapters"><header><h2>章节导航 <small>共 4 节</small></h2><span>支持点击跳转定位</span></header>{chapters.map((name,i)=><button key={name} className={active===i?"active":""} onClick={()=>onSeek(i*30)}><span className="ai-chapter-index">{String(i+1).padStart(2,"0")}</span><span><small>{stamp(i*30)} — {stamp((i+1)*30)} {active===i&&playing?"播放中":""}</small><strong>{name}</strong></span><img src={active===i&&playing?"/assets/card-pause.svg":"/assets/e5808.svg"} alt=""/></button>)}</section>
     <p className="ai-demo-note">精听内容为模拟演示</p>
    </div>}
    {tab===1&&<div className="ai-transcript"><button className="ai-chapter-selector" onClick={()=>setChapterMenu(!chapterMenu)} aria-expanded={chapterMenu}>{chapters[active]} <span>⌄</span><small>演示</small></button>{chapterMenu&&<div className="ai-chapter-options">{chapters.map((name,i)=><button key={name} onClick={()=>{onSeek(i*30);setChapterMenu(false)}}>{name}</button>)}</div>}{transcript.map((text,i)=><button className={`ai-paragraph ${active===i?"active":""}`} key={text} onClick={()=>onSeek(i*30)}><time>{stamp(i*30)}</time><p>{i===0?<>刚开始一件新事时，<span>我们总觉得应该马上懂得所有事情。</span></>:text}</p></button>)}</div>}
    {tab===2&&<div className="ai-chat" ref={messages} role="region" aria-label="聊天记录" tabIndex={0} onScroll={event=>{const node=event.currentTarget;followLatest.current=node.scrollHeight-node.scrollTop-node.clientHeight<48}}>{turns.length===0?<><h3>猜你想问 <small>· 基于本集精选</small></h3>{questions.map(text=><button className="ai-question" key={text} onClick={()=>ask(text)}>{text}<img src="/assets/ai-next.svg" alt=""/></button>)}</>:turns.map(turn=><div className="ai-chat-turn" key={turn.id}><div className="ai-question-bubble">{turn.question}</div><article className="ai-answer" aria-live={turn.answer===null?"polite":"off"}>{turn.answer===null?<p role="status">正在整理本集内容…</p>:<><p>{turn.answer}</p><button onClick={()=>onSeek(30)}><img src="/assets/ai-play.svg" alt=""/>试听演示片段 <small>00:30</small></button><small>演示音频，非本期原声 · 回答为预设演示</small></>}</article></div>)}</div>}
    </div>
   </main>
  </div>
  {tab===2&&<form className="ai-composer" onSubmit={e=>{e.preventDefault();ask(input)}}><input aria-label="向 AI 提问" placeholder={turns.length?"继续提问…":"您可以输入内容向我提问"} maxLength={300} value={input} onChange={e=>setInput(e.target.value)}/><button disabled={!input.trim()||pending} aria-label="发送问题"><img src="/assets/ai-send.svg" alt=""/></button></form>}
 </section>
}
