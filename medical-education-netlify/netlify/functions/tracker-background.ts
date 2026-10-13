import {verifySecret} from '../../lib/session.mjs';
import {runTrackerJob} from '../../lib/tracker-job';
export default async function(request:Request){if(!verifySecret(request.headers.get('authorization'),process.env.CRON_SECRET||''))return;if(process.env.CONTEXT&&process.env.CONTEXT!=='production')return;await runTrackerJob()}
export const config={background:true};
