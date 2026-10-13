import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'აკადემია — სამედიცინო განათლების მართვა',description:'აკადემიური პროგრამების, რეზიდენტურისა და უწყვეტი სამედიცინო განათლების კოორდინატორი'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ka" data-theme="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html: "try{document.documentElement.dataset.theme=localStorage.getItem('academia-theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}"}} /></head><body>{children}</body></html>}
