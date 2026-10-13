import {dispatchTracker} from '../../lib/tracker-job';
export default async function(){if(process.env.CONTEXT&&process.env.CONTEXT!=='production')return;await dispatchTracker()}
export const config={schedule:'0 4,14 * * *'};
