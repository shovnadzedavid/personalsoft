import * as cheerio from 'cheerio/slim';
import robotsParser from 'robots-parser';
import {parsePage,parseFeed,canonical,topic,type Program} from './tracker-parser';
import type {SourceConfig} from './tracker-sources';
import {parseWorkbook} from './tracker-workbook';
export const crawlerAgent='AcademiaCME/1.0';
const MAX_BYTES=2500000;
export async function digest(s:string){const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(a)).map(n=>n.toString(16).padStart(2,'0')).join('')}
export function permitted(input:string,source:SourceConfig){try{const u=new URL(input);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&source.urls.some(s=>{const host=new URL(s).hostname.replace(/^www\./,'');return u.hostname.replace(/^www\./,'')===host||u.hostname.endsWith('.'+host)})}catch{return false}}
async function limitedResponse(response:Response){const reader=response.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>MAX_BYTES)throw Error('გვერდის ზომა დაშვებულ ზღვარს აღემატება');chunks.push(r.value)}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length}return out}finally{reader.releaseLock()}}
async function retrieve(url:string,source:SourceConfig,deadline=Date.now()+60000){let current=url;for(let n=0;n<4;n++){if(!permitted(current,source))throw Error('გადამისამართება წყაროს დომენს სცდება');const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(Math.max(1,Math.min(12000,deadline-Date.now()))),headers:{'User-Agent':crawlerAgent,'Accept':'text/html,application/rss+xml,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;q=0.9,*/*;q=0.3'}});if([301,302,303,307,308].includes(r.status)){const location=r.headers.get('location');if(!location)throw Error('გადამისამართების მისამართი არ არის');await r.body?.cancel();current=new URL(location,current).toString();continue}return{url:current,status:r.status,bytes:await limitedResponse(r),type:r.headers.get('content-type')||''}}throw Error('ზედმეტად ბევრი გადამისამართება')}
export async function collectSource(source:SourceConfig){
 const deadline=Date.now()+22000;
 const robots=new Map<string,ReturnType<typeof robotsParser>>(),errors:string[]=[],blocked:string[]=[],programs:Program[]=[],visited=new Set<string>();
 async function allowed(url:string){const origin=new URL(url).origin;if(!robots.has(origin)){const r=await retrieve(origin+'/robots.txt',source,deadline);if(r.status!==404&&(r.status<200||r.status>=300))throw Error('robots.txt ვერ შემოწმდა (HTTP '+r.status+')');robots.set(origin,robotsParser(origin+'/robots.txt',r.status===404?'':new TextDecoder().decode(r.bytes)))}const robot=robots.get(origin)!;if(robot.isAllowed(url,crawlerAgent)===false||robot.isAllowed(url,'*')===false){blocked.push(url);return false}return true}
 const queue=source.urls.map(url=>({url,label:'წყაროს საწყისი გვერდი',score:99}));let readable=0;let files=0;const maxPages=14;
 while(queue.length&&visited.size<maxPages&&Date.now()<deadline){const item=queue.shift()!;let key:string;try{key=canonical(item.url)}catch{continue}if(visited.has(key)||!permitted(item.url,source))continue;visited.add(key);try{
 if(!await allowed(item.url))continue;
 const delay=robots.get(new URL(item.url).origin)?.getCrawlDelay(crawlerAgent)||0;if(delay*1000>Math.max(0,deadline-Date.now())){errors.push('წყაროს მოთხოვნილი ინტერვალი დაშვებულ დროს აღემატება; შემოწმება ნაწილობრივ შეჩერებულია');break}if(delay)await new Promise(r=>setTimeout(r,delay*1000));
 const r=await retrieve(item.url,source,deadline);if(r.status<200||r.status>=300)throw Error('HTTP '+r.status);
 if(/\.xlsx(?:\?|$)/i.test(r.url)){const found=parseWorkbook(r.bytes,r.url,source);programs.push(...found);files++;readable++;continue}
 if(!/text|html|xml|json|rss/.test(r.type)&&r.type)throw Error('მხარდაუჭერელი ფორმატი: '+r.type);
 const html=new TextDecoder().decode(r.bytes);if(/captcha|checking your browser|just a moment\.\.\./i.test(html.slice(0,3000)))throw Error('ავტომატური კითხვა დაცვით არის შეზღუდული');
 readable++;
 if(/xml|rss/.test(r.type)||/<rss\b|<feed\b/i.test(html.slice(0,500))){const found=parseFeed(html,r.url,source);programs.push(...found);for(const p of found.slice(0,6))queue.push({url:p.url,label:p.name,score:10});continue}
 const parsed=parsePage(html,r.url,source);programs.push(...parsed.programs);
 const $=cheerio.load(html);let documentBase=r.url;try{documentBase=new URL($('base').attr('href')||r.url,r.url).toString()}catch{}$('link[rel="alternate"]').each((_,e)=>{if(/rss|atom/i.test($(e).attr('type')||'')){try{const target=new URL($(e).attr('href')!,documentBase).toString();if(permitted(target,source)&&!visited.has(canonical(target)))queue.push({url:target,label:'ოფიციალური სიახლეების ნაკადი',score:9})}catch{}}});
 // Catalogue workbooks are live source files, not manually copied datasets.
 $('a[href]').each((_,e)=>{const href=$(e).attr('href')||'',label=$(e).text().trim();if(/\.xlsx(?:\?|$)/i.test(href)&&topic.test(label)){try{queue.push({url:new URL(href,documentBase).toString(),label,score:15})}catch{}}});
 queue.push(...parsed.links.filter(l=>permitted(l.url,source)&&!visited.has(canonical(l.url))));queue.sort((a,b)=>b.score-a.score);
 if(!parsed.programs.length&&!parsed.links.length&&$('body').text().replace(/\s/g,'').length<120)errors.push(r.url+': გვერდი შესაძლოა JavaScript-ის შესრულებას საჭიროებდეს');
 }catch(e:any){errors.push(item.url+': '+(e.name==='TimeoutError'?'კითხვის დრო ამოიწურა':String(e.message||e)).slice(0,220))}}
 const unique=[...new Map(programs.map(p=>[p.url+'|'+(p.entryKey||''),p])).values()];
 return{programs:unique,details:{pages:visited.size,readable,files,blocked:blocked.slice(0,10),errors:errors.slice(0,8),limited:queue.length>0&&(visited.size>=maxPages||Date.now()>=deadline),timedOut:Date.now()>=deadline},status:readable===0?(blocked.length?'blocked':'error'):errors.length||blocked.length?'partial':unique.length?'ok':'no-matches',error:errors[0]||(blocked.length?'robots.txt ზღუდავს ზოგი გვერდის კითხვას':null)};
}
