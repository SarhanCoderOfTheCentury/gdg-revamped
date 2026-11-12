import type {IconName} from './Icon';
export type ChannelId = 'workshops' | 'discussions' | 'networking' | 'projects' | 'announcements' | 'questions';
export const DISCORD_FPS=30,DISCORD_DURATION=420,DISCORD_LOOP_START=60;
export const COMMUNITY_INVITE='https://discord.gg/vuHB4E7DVq';
export const CHANNELS:{id:ChannelId;label:string;title:string;caption:string;description:string;color:string;pale:string;icon:IconName;prompts:string[]}[]=[
{id:'workshops',label:'Workshops',title:'Learn by doing.',caption:'Explore a new skill.',description:'Keep the learning going. Compare notes, try a new tool, and share what you made after a workshop.',color:'#3977cb',pale:'#edf4ff',icon:'build',prompts:['What did you build in the last workshop?','Which tool would you like to learn next?','Here is one thing I learned today.']},
{id:'discussions',label:'Group discussions',title:'Think out loud.',caption:'Every perspective helps.',description:'Bring the interesting questions and the unfinished ideas. A different perspective can be the start of something great.',color:'#c46d52',pale:'#fff2ec',icon:'message',prompts:['What are you curious about this week?','How would you approach this problem?','What is a tech opinion you changed your mind about?']},
{id:'networking',label:'Networking',title:'Find your people.',caption:'Meet the minds around you.',description:'Say hello to people who share your curiosity. Swap interests, find a collaborator, or start a new conversation.',color:'#298667',pale:'#ebf7f1',icon:'connect',prompts:['Hi! I am learning ___ and would love to connect.','Anyone interested in building a small project together?','What is everyone working on right now?']},
{id:'projects',label:'Project help',title:'Build it together.',caption:'A second pair of eyes.',description:'Bring a bug, a prototype, or a tricky design choice. Share context and discover another way forward.',color:'#7c68b3',pale:'#f4effc',icon:'code',prompts:['Could someone review this small part of my project?','I expected ___ but got ___. Here is what I tried.','Which feature would you improve first, and why?']},
{id:'announcements',label:'Announcements',title:'Stay in the loop.',caption:'Know what comes next.',description:'A place for community updates and upcoming opportunities. Find the next thing you want to be part of.',color:'#a37e25',pale:'#fff8e6',icon:'bell',prompts:['What should I know before joining my first event?','Where can I find the next community session?','How can I help with an upcoming activity?']},
{id:'questions',label:'Ask questions',title:'Ask away.',caption:'Curiosity belongs here.',description:'Every developer starts somewhere. Ask clearly, share what you have tried, and learn a little more together.',color:'#338795',pale:'#eaf7f9',icon:'question',prompts:['Could someone explain ___ with a simple example?','What is a good first step for learning ___?','Here is what I understand so far. Am I on the right track?']}
];
export function getDiscordInvite(value:string):string|null {
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
 const valid=url.hostname==='discord.gg'?/^\/[A-Za-z0-9-]+\/?$/.test(url.pathname):(url.hostname==='discord.com'||url.hostname==='www.discord.com')&&/^\/invite\/[A-Za-z0-9-]+\/?$/.test(url.pathname);
 return valid?url.href:null;}catch{return null;}
}

