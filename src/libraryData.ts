export type LibraryEpisode = {id:string;title:string;source:string;category:string;cover:string;reason:string;length:string}
export type ListeningRecord = {id:string;progress:number;total:number;mode:"clip"|"full";at:number}
export const discoveryEpisodes:LibraryEpisode[]=[
 {id:"discover-space",title:"忙碌生活里，给自己留一点空间",source:"日谈公园",category:"生活",cover:"/assets/library/d8ed4.png",reason:"把生活的节奏，慢慢找回来",length:"45分钟"},
 {id:"discover-career",title:"初入职场，别害怕「不合群」",source:"声东击西",category:"职场",cover:"/assets/library/268a0.png",reason:"允许自己慢慢建立真实边界",length:"38分钟"},
 {id:"discover-night",title:"一个人的夜晚，也能好好相处",source:"夜间声音实验室",category:"成长",cover:"/assets/library/7a9c5.png",reason:"在独处的时间里，找到自己的节奏。",length:"45分钟"},
 {id:"discover-life",title:"把生活的节奏，慢慢找回来",source:"日谈公园",category:"生活",cover:"/assets/library/ea1f2.png",reason:"从一件具体的小事开始，给生活留一点空间。",length:"32分钟"},
 {id:"discover-work",title:"初入职场，也可以慢慢来",source:"职场漫谈",category:"职场",cover:"/assets/library/cc489.png",reason:"给经验积累一点时间。",length:"38分钟"},
 {id:"discover-walk",title:"给忙碌的一天，留一点放空",source:"声音散步",category:"文化",cover:"/assets/library/cc489.png",reason:"放慢脚步，听见日常生活。",length:"36分钟"},
]
export function readStored<T>(key:string,fallback:T,valid:(data:unknown)=>data is T):T{try{const value=JSON.parse(localStorage.getItem(key)||"null");return valid(value)?value:fallback}catch{return fallback}}
export const validFavorites=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==="string")
export const validHistory=(v:unknown):v is ListeningRecord[]=>Array.isArray(v)&&v.every(x=>x&&typeof x.id==="string"&&Number.isFinite(x.progress)&&x.progress>=0&&Number.isFinite(x.total)&&x.total>0&&Number.isFinite(x.at)&&(x.mode==="clip"||x.mode==="full"))
export const time=(n:number)=>`${Math.floor(n/60).toString().padStart(2,"0")}:${Math.floor(n%60).toString().padStart(2,"0")}`
