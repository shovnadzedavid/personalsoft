export type Row={id:string;kind:string;data:Record<string,any>;revision:number;updated:string};
export const kinds=['universities','rooms','sessions','doctors','events','credits','residents','modules','attendance','payments','tasks','acts'] as const;
export function earned(rows:Row[],doctor:string,year:string){return rows.filter(r=>r.kind==='credits'&&r.data.doctor===doctor&&String(r.data.date||'').startsWith(year)&&r.data.status==='verified'&&(!r.data.foreign||r.data.recognition)).reduce((s,r)=>s+Number(r.data.points||0),0)}
export function amount(session:Row){let d=session.data;return Math.round(Number(d.rate||0)*(d.unit==='student'?Number(d.students||0):d.unit==='session'?1:duration(d.start,d.end))*100)/100}
export function duration(start:string,end:string){const mins=(s:string)=>{const [h,m]=String(s||'').split(':').map(Number);return h*60+m};return Math.max(0,(mins(end)-mins(start))/60)||0}
export function conflicts(rows:Row[],s:Record<string,any>,id?:string){return rows.filter(r=>r.kind==='sessions'&&r.id!==id&&r.data.status!=='cancelled'&&s.status!=='cancelled'&&r.data.date===s.date&&r.data.room===s.room&&r.data.start<s.end&&s.start<r.data.end)}
export function validate(kind:string,d:Record<string,any>,rows:Row[],id?:string){
 if(kind==='universities'&&d.memoSource&&!d.memoConfirmed)return 'დაადასტურე მემორანდუმიდან გადმოტანილი ინფორმაცია';
 if(!kinds.includes(kind as any))return 'უცნობი ჩანაწერი';
 if(['universities','rooms','doctors','events','residents','modules','tasks'].includes(kind)&&!String(d.name||'').trim())return 'შეავსე დასახელება';
 for(const key of ['rate','students','capacity','points','target','amount','score'])if(d[key]!==undefined&&d[key]!==''&&(!Number.isFinite(Number(d[key]))||Number(d[key])<0))return 'რიცხვი უნდა იყოს ნულზე მეტი ან ტოლი';
 const ref=(key:string,k:string)=>!d[key]||rows.some(r=>r.id===d[key]&&r.kind===k);
 const refs:Record<string,Record<string,string>>={sessions:{university:'universities',room:'rooms'},credits:{doctor:'doctors',event:'events'},modules:{resident:'residents'},attendance:{resident:'residents',module:'modules'},payments:{university:'universities',resident:'residents'},acts:{university:'universities'}};
 for(const [key,k] of Object.entries(refs[kind]||{}))if(!ref(key,k))return 'დაკავშირებული ჩანაწერი ვერ მოიძებნა';
 if(kind==='sessions'){
 if(!d.university||!d.room||!d.date||!d.start||!d.end||!d.group)return 'შეავსე ჯგუფი, უნივერსიტეტი, აუდიტორია და დრო';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.end)||d.start>=d.end)return 'შეამოწმე თარიღი და დაწყება/დასრულება';
 if(conflicts(rows,d,id).length)return 'ამ დროს აუდიტორია უკვე დაკავებულია';
 const room=rows.find(r=>r.id===d.room);if(room&&Number(d.students)>Number(room.data.capacity))return 'ჯგუფის ზომა აუდიტორიის ტევადობას აღემატება';
 }
 if(kind==='credits'&&(!d.doctor||!d.date||!d.name))return 'მიუთითე ექიმი, ღონისძიება და თარიღი';
 if(kind==='credits'&&d.status==='verified'&&(!d.certificate||(d.foreign&&!d.recognition)))return 'დადასტურებისთვის საჭიროა სერტიფიკატი და, უცხოური ქულებისთვის, აღიარების დოკუმენტი';
 if(kind==='attendance'&&(!d.resident||!d.date||!d.status))return 'მიუთითე რეზიდენტი, თარიღი და დასწრება';
 if(kind==='attendance'&&rows.some(r=>r.kind===kind&&r.id!==id&&r.data.resident===d.resident&&r.data.module===d.module&&r.data.date===d.date))return 'ამ თარიღის დასწრება უკვე აღრიცხულია';
 if(kind==='modules'&&(!d.resident||!d.from||!d.to||d.from>d.to))return 'შეამოწმე რეზიდენტი და მოდულის პერიოდი';
 if(kind==='payments'&&(!d.date||(!d.university&&!d.resident)||(d.university&&d.resident)))return 'აირჩიე ერთი გადამხდელი და თარიღი';
 return null;
}
