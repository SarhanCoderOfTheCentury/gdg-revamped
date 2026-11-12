import {useState} from 'react';
import {AbsoluteFill,Img,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {Icon} from './Icon';
import {CHANNELS,DISCORD_DURATION,DISCORD_LOOP_START,getDiscordInvite,type ChannelId} from './discord-data';
export type DiscordSceneProps={mobile:boolean;reducedMotion:boolean;selected:ChannelId|null;tour:boolean;inviteUrl:string;symbolSrc:string;onSelect:(id:ChannelId|null)=>void;};
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
export function DiscordScene({mobile,reducedMotion,selected,tour,inviteUrl,symbolSrc,onSelect}:DiscordSceneProps){
 const rawFrame=useCurrentFrame(),frame=reducedMotion?120:rawFrame,{fps}=useVideoConfig();
 const [hovered,setHovered]=useState<ChannelId|null>(null);
 const ambient=Math.max(0,frame-DISCORD_LOOP_START),phase=ambient/(DISCORD_DURATION-DISCORD_LOOP_START)*Math.PI*2;
 const active=selected??hovered??(tour&&!reducedMotion?CHANNELS[Math.floor(ambient/60)%6].id:null);
 const entrance=spring({frame,fps,config:{damping:24,stiffness:110}});
 const width=mobile?600:1120,height=mobile?1040:680;
 const panel=mobile?{x:105,y:250,width:390,height:390}:{x:370,y:136,width:380,height:420};
 const positions=mobile?[{x:24,y:86},{x:322,y:86},{x:24,y:650},{x:322,y:650},{x:24,y:806},{x:322,y:806}]:[{x:44,y:102},{x:814,y:102},{x:24,y:280},{x:834,y:280},{x:52,y:458},{x:806,y:458}];
 const cardWidth=mobile?254:262,cardHeight=132,validInvite=getDiscordInvite(inviteUrl);
 const paths=positions.map((position,i)=>{
  if(mobile){const sx=position.x+cardWidth/2,sy=position.y+(i<2?cardHeight:0),ex=i%2?panel.x+panel.width-60:panel.x+60,ey=i<2?panel.y+35:panel.y+panel.height-20,mid=(sy+ey)/2;return 'M '+sx+' '+sy+' C '+sx+' '+mid+', '+ex+' '+mid+', '+ex+' '+ey;}
  const left=i%2===0,sx=position.x+(left?cardWidth:0),sy=position.y+cardHeight/2,ex=left?panel.x+20:panel.x+panel.width-20,ey=232+Math.floor(i/2)*106,mid=(sx+ex)/2;
  return 'M '+sx+' '+sy+' C '+mid+' '+sy+', '+mid+' '+ey+', '+ex+' '+ey;
 });
 return <AbsoluteFill className="dc-scene" onKeyDown={event=>{if(event.key==='Escape'){onSelect(null);setHovered(null);}}}>
  <AbsoluteFill className="dc-scene-grid"/>
  <div className="dc-scene-eyebrow" style={{fontSize:mobile?14:10,left:mobile?28:34,right:mobile?28:34,top:30}}><span><i/>YOUR COMMUNITY, A LITTLE CLOSER.</span><span>{mobile?'DISCORD':'GOOD QUESTIONS. GREAT COMPANY.'}</span></div>
  <svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}} aria-hidden="true">
   {!mobile&&<><circle cx="560" cy="340" r="247" fill="none" stroke="#e8eaf6"/><circle cx="560" cy="340" r="269" fill="none" stroke="#e3e6f3" strokeDasharray="1 11" transform={'rotate('+(reducedMotion?0:Math.sin(phase)*7)+' 560 340)'}/></>}
   {paths.map((d,i)=>{const ch=CHANNELS[i],focused=!active||active===ch.id,reveal=interpolate(frame,[7+i*4,48+i*4],[0,1],clamp),progress=((ambient+i*60)%360)/360;
    return <g key={ch.id} opacity={focused?1:.24} style={{transition:'opacity .25s'}}><path d={d} stroke="#e8ebf4" fill="none" strokeWidth="1.4"/><path d={d} stroke={ch.color} fill="none" pathLength="1" strokeWidth={active===ch.id?2.5:1.5} strokeDasharray="1" strokeDashoffset={1-reveal} opacity={active===ch.id ? .85 : .34}/>{!reducedMotion&&<path d={d} stroke={ch.color} fill="none" strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray=".012 1" strokeDashoffset={-progress} opacity={reveal*.9}/>}</g>;
   })}
   {!mobile&&CHANNELS.map((ch,i)=>{const angle=i*Math.PI/3+Math.sin(phase)*.1;return <circle key={ch.id} cx={560+Math.cos(angle)*247} cy={340+Math.sin(angle)*247} r="3.5" fill={ch.color} opacity=".55"/>;})}
  </svg>
  <div className={'dc-invite-panel '+(mobile?'dc-panel-mobile':'')} style={{left:panel.x,top:panel.y,width:panel.width,height:panel.height,opacity:entrance,transform:'translateY('+((1-entrance)*24+(reducedMotion?0:Math.sin(phase)*3))+'px) scale('+(.96+entrance*.04)+')'}}>
   <div className="dc-panel-caption">A PLACE TO LEARN. A SPACE TO BELONG.</div>
   <div className="dc-brand-lockup"><span className="dc-brand-tile"><Img src={symbolSrc} pauseWhenLoading={false} alt="" style={{width:44,height:33}}/></span><span>Discord<span>GDG ON CAMPUS · DSU</span></span></div>
   <h2>Good company.<br/>Great conversations.</h2>
   <p>Learn, share, and build with<br/>the GDG@DSU community.</p>
   <a className="dc-join-button" href={validInvite??undefined} target="_blank" rel="noreferrer" aria-label="Join the GDG on Campus Discord community" aria-disabled={!validInvite} onClick={event=>{if(!validInvite)event.preventDefault();}}><span>Join the conversation</span><Icon name="arrow" size={19}/></a>
   <span className="dc-invite-footnote">Your next conversation starts here.<Icon name="arrow" size={10}/></span>
  </div>
  {CHANNELS.map((ch,i)=>{const entry=spring({frame:frame-8-i*4,fps,config:{damping:21,stiffness:130}}),raised=active===ch.id,float=reducedMotion?0:Math.sin(phase+i*Math.PI/3)*2.5;
   return <button key={ch.id} type="button" data-channel={ch.id} className={'dc-channel '+(raised?'dc-channel-active ':'')+(mobile?'dc-channel-mobile':'')} aria-label={'Explore '+ch.label} aria-pressed={selected===ch.id} onClick={()=>onSelect(selected===ch.id?null:ch.id)} onPointerEnter={()=>setHovered(ch.id)} onPointerLeave={()=>setHovered(null)} onFocus={()=>setHovered(ch.id)} onBlur={()=>setHovered(null)} style={{'--dc-accent':ch.color,'--dc-pale':ch.pale,left:positions[i].x,top:positions[i].y,width:cardWidth,height:cardHeight,opacity:entry*(active&&!raised ? .63 : 1),transform:'translateY('+((1-entry)*22+float+(raised&&!reducedMotion?-5:0))+'px)',zIndex:raised?4:3} as React.CSSProperties}>
    <span className="dc-channel-top"><span className="dc-channel-icon"><Icon name={ch.icon} size={mobile?20:17}/></span><span>{ch.label}</span><span className="dc-channel-index">0{i+1}</span></span>
    <strong>{ch.title}</strong><span className="dc-channel-caption">{ch.caption}</span><span className="dc-channel-arrow" aria-hidden="true"><Icon name="arrow" size={12}/></span>
   </button>;
  })}
  <div className="dc-scene-bottom" style={{left:mobile?28:34,right:mobile?28:34,bottom:mobile?30:27,fontSize:mobile?15:10}}><span>{mobile?'Tap a channel. Find your place.':'SIX WAYS IN. ONE COMMUNITY.'}</span><span className="dc-conversation-mark"><i/><i/><i/>The conversation keeps going.</span></div>
 </AbsoluteFill>;
}

