import {requireChatGPTUser} from './auth';
import Workspace from './workspace';
export const dynamic='force-dynamic';
export default async function Page(){const user=await requireChatGPTUser('/');return <Workspace user={user.displayName}/>}
