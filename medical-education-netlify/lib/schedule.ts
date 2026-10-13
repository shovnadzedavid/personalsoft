export type Schedule={mode:'dates'|'weekly';dates?:{date:string;start?:string;end?:string}[];from?:string;to?:string;weekdays?:number[]};
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s}
export function expandSchedule(s:Schedule,start:string,end:string){
 let dates:{date:string;start?:string;end?:string}[]=[];
 if(s.mode==='dates'){
 if(!Array.isArray(s.dates))throw Error('მონიშნე თარიღები');
 dates=s.dates;
 if(dates.some(d=>!validDate(d.date)))throw Error('შეამოწმე არჩეული თარიღები');
 if(new Set(dates.map(d=>d.date)).size!==dates.length)throw Error('თარიღი განმეორებულია');
 }else if(s.mode==='weekly'){
 if(!validDate(s.from||'')||!validDate(s.to||'')||s.from!>s.to!)throw Error('შეამოწმე დაწყებისა და დასრულების თარიღები');
 if(!Array.isArray(s.weekdays)||!s.weekdays.length||s.weekdays.some(n=>!Number.isInteger(n)||n<0||n>6))throw Error('მონიშნე კვირის დღეები');
 const from=Date.parse(s.from+'T12:00:00Z'),to=Date.parse(s.to+'T12:00:00Z');
 if((to-from)/86400000>730)throw Error('ერთი სერია მაქსიმუმ ორ წელს მოიცავს');
 for(let t=from;t<=to;t+=86400000){const d=new Date(t);if(s.weekdays.includes(d.getUTCDay()))dates.push({date:d.toISOString().slice(0,10)})}
 }else throw Error('აირჩიე განრიგის შევსების წესი');
 if(!dates.length)throw Error('არჩეულ პერიოდში შესაბამისი თარიღი არ არის');
 if(dates.length>500)throw Error('ერთ სერიაში მაქსიმუმ 500 მეცადინეობაა');
 return dates.map(d=>({date:d.date,start:d.start||start,end:d.end||end})).sort((a,b)=>a.date.localeCompare(b.date));
}
