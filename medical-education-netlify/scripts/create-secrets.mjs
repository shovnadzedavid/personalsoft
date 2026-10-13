import {createInterface} from 'node:readline/promises';
import {randomBytes} from 'node:crypto';
import {writeFileSync,existsSync} from 'node:fs';
import {passwordHash} from '../lib/session.mjs';
if(existsSync('.env.local'))throw Error('.env.local უკვე არსებობს. ძველ პარამეტრებს ავტომატურად არ ვცვლით.');
const rl=createInterface({input:process.stdin,output:process.stdout});const email=(await rl.question('ადმინისტრატორის ელფოსტა: ')).trim();const password=await rl.question('შეიყვანე მინიმუმ 12 სიმბოლოს პაროლი (მხოლოდ შენს კომპიუტერში): ');rl.close();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('არასწორი ელფოსტა');const text=['ADMIN_EMAIL='+email,'OWNER_USER_ID=fff4b90d-98ac-49ce-bcc7-9a54e8e1339e','ADMIN_PASSWORD_HASH='+passwordHash(password),'SESSION_SECRET='+randomBytes(32).toString('hex'),'CRON_SECRET='+randomBytes(32).toString('hex'),'APP_URL=https://YOUR-SITE.netlify.app','TRACKER_SCHEDULE_ENABLED=true'].join('\n')+'\n';writeFileSync('.env.local',text,{mode:0o600});console.log('შეიქმნა .env.local. Netlify-ის გარემოს პარამეტრებში გადაიტანე მისი მნიშვნელობები. ეს ფაილი GitHub-ზე არ ატვირთო.');
