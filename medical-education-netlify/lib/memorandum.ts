export type Extraction={name:string;paymentTerms:string;agreement:string;evidence:{field:string;quote:string}[];candidates:string[];warnings:string[];text:string};
export function extractMemorandum(input:string):Extraction{
 const text=input.replace(/\r/g,'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
 if(text.length<50)throw Error('ფაილში წაკითხვადი ტექსტი ვერ მოიძებნა. სკანირებული დოკუმენტი გადაიყვანე ტექსტიან PDF-ად ან ატვირთე DOCX.');
 if(text.length>100000)throw Error('დოკუმენტი ზედმეტად გრძელია. ატვირთე მემორანდუმი ცალკე ფაილად.');
 const blocks=text.split(/\n\s*\n|\n/).map(s=>s.trim()).filter(Boolean);
 const candidates:string[]=[];const evidence:Extraction['evidence']=[];const warnings:string[]=[];
 // Only explicit institution names, never a guess derived from the filename.
 const patterns=[/[„“"]([^„“"\n]{2,180}უნივერსიტეტ[^„“"\n]{0,60})[“”"]/gu,/(?:უნივერსიტეტის დასახელება|უნივერსიტეტი)\s*[:–—]\s*([^\n;]{3,180})/gu,/[„“"]([^„“"\n]{2,180}(?:University|UNIVERSITY)[^„“"\n]{0,60})[“”"]/g];
 patterns.push(/(?:სსიპ|შპს|ააიპ|ა\(ა\)იპ)\s*[-–—]?\s*[„"]?([^\n,;„“"]{2,180}?უნივერსიტეტი)/gu);
 for(const pattern of patterns)for(const m of text.matchAll(pattern)){let value=m[1].trim();if(!candidates.includes(value))candidates.push(value)}
 const name=candidates.length===1?candidates[0]:'';
 if(name)evidence.push({field:'უნივერსიტეტი',quote:blocks.find(s=>s.includes(name))||name});
 else warnings.push(candidates.length?'ფაილში რამდენიმე უნივერსიტეტის დასახელებაა. აირჩიე შესაბამისი.':'უნივერსიტეტის დასახელება ერთმნიშვნელოვნად ვერ ამოიცნო. შეავსე ან მონიშნე ტექსტიდან.');
 const indices=blocks.flatMap((s,i)=>/(ანგარიშსწორ|ანაზღაურ|ტარიფ|საფასურ|გადასახად|გადახდ|ღირებულებ|ფინანსურ|ლარ(?:ი|ის|ით)|₾|GEL)/iu.test(s)?[i]:[]);
 const chosen=new Set<number>();for(const i of indices){chosen.add(i);if(i+1<blocks.length&&!/^\d+[.)]\s/.test(blocks[i+1]))chosen.add(i+1)}
 const paymentTerms=[...chosen].sort((a,b)=>a-b).map(i=>blocks[i]).join('\n\n');
 if(paymentTerms)evidence.push({field:'ანგარიშსწორების პირობები — ნაპოვნი მონაკვეთები',quote:paymentTerms});else warnings.push('ანგარიშსწორების პირობა ვერ მოიძებნა. შესაძლოა ცალკე დანართში იყოს.');
 const numbers=[...text.matchAll(/(?:მემორანდუმი|მემორანდუმის|ხელშეკრულება|ხელშეკრულების)\s*(?:ნომერი\s*[:]?|[№N#])\s*([\p{L}\p{N}/._-]+)/gu)].map(m=>m[1]);
 const agreement=new Set(numbers).size===1?numbers[0]:'';if(agreement)evidence.push({field:'მემორანდუმის ნომერი',quote:blocks.find(s=>s.includes(agreement))||agreement});
 warnings.push('თანხა, პროცენტი და ანგარიშსწორების ერთეული არ გამოითვლება ვარაუდით. ქვემოთ გადმოტანილია ტექსტი; შეადარე პირველწყაროს და დაადასტურე.');
 return {name,paymentTerms,agreement,candidates,evidence,warnings,text};
}
