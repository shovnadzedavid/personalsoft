export async function readDocument(file:File):Promise<string>{
 if(file.size>10*1024*1024)throw Error('ფაილის ზომა მაქსიმუმ 10 მბ უნდა იყოს');
 const ext=file.name.split('.').pop()?.toLowerCase();
 if(ext==='txt')return file.text();
 if(ext==='doc')throw Error('ძველი .doc ფორმატი: Word-ში შეინახე DOCX-ად ან ტექსტიან PDF-ად და ხელახლა ატვირთე.');
 if(ext==='docx'){const mammoth=await import('mammoth/mammoth.browser');const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return result.value;}
 if(ext==='pdf'){
 const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true});const doc=await task.promise;
 try{if(doc.numPages>100)throw Error('მაქსიმუმ 100 გვერდიანი PDF არის დაშვებული');let text='';for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);const content=await page.getTextContent();let line='';let y:number|undefined;for(const item of content.items){if(!('str'in item))continue;const next=item.transform[5];if(y!==undefined&&Math.abs(next-y)>3){text+=line+'\n';line=''}line+=(line?' ':'')+item.str;y=next;if(item.hasEOL){text+=line+'\n';line='';y=undefined}}text+=line+'\n\n'}return text}finally{await task.destroy()}
 }
 throw Error('მემორანდუმის ამოსაკითხად აირჩიე DOCX, ტექსტიანი PDF ან TXT.');
}
