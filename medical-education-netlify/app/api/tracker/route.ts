import {getChatGPTUser} from '../../auth';
import {trackerData} from '../../../lib/tracker-store';
export const dynamic='force-dynamic';
// Shared public-source data, protected by this owner-private Site's platform boundary.
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'შესვლა აუცილებელია'},{status:401});try{return Response.json(await trackerData(),{headers:{'Cache-Control':'private, no-store'}})}catch(e){console.error(e);return Response.json({error:'ტრეკერის მონაცემები ვერ ჩაიტვირთა'},{status:500})}}
