'use client';

import {forwardRef,useCallback,useEffect,useImperativeHandle,useMemo,useRef,useState} from 'react';
import {Player,type PlayerRef,type CallbackListener} from '@remotion/player';
import {DiscordScene} from './DiscordScene';
import {CHANNELS,COMMUNITY_INVITE,DISCORD_DURATION,DISCORD_FPS,DISCORD_LOOP_START,type ChannelId} from './discord-data';
import {Icon} from './Icon';
import './discord-community.css';
export interface DiscordCommunityHandle{replay:()=>void;pause:()=>void;}
export interface DiscordCommunityProps{layout?:'auto'|'desktop'|'mobile';inviteUrl?:string;reducedMotion?:boolean;showControls?:boolean;autoPlay?:boolean;symbolSrc?:string;onChannelChange?:(id:ChannelId|null)=>void;}
export const DiscordCommunity=forwardRef<DiscordCommunityHandle,DiscordCommunityProps>(function DiscordCommunity({layout='auto',inviteUrl=COMMUNITY_INVITE,reducedMotion:reducedOverride,showControls=false,autoPlay=true,symbolSrc='/assets/discord-symbol.svg',onChannelChange},ref){
 const player=useRef<PlayerRef>(null),container=useRef<HTMLDivElement>(null);
 const [narrow,setNarrow]=useState(false),[systemReduced,setSystemReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [selected,setSelected]=useState<ChannelId|null>(null),[tour,setTour]=useState(false),[frame,setFrame]=useState(0),[playing,setPlaying]=useState(autoPlay);
 const wantsPlay=useRef(autoPlay),visible=useRef(true),motionAllowed=useRef(true);
 const reducedMotion=reducedOverride??systemReduced;motionAllowed.current=!reducedMotion;
 const mobile=layout==='mobile'||(layout==='auto'&&narrow);
 const select=useCallback((id:ChannelId|null)=>{setSelected(id);setTour(false);onChannelChange?.(id);},[onChannelChange]);
 const replay=useCallback(()=>{if(!motionAllowed.current)return;player.current?.seekTo(0);wantsPlay.current=true;player.current?.play();},[]);
 const pause=useCallback(()=>{wantsPlay.current=false;player.current?.pause();},[]);
 useImperativeHandle(ref,()=>({replay,pause}),[replay,pause]);
 useEffect(()=>{
  if(!container.current)return;const resize=new ResizeObserver(entries=>setNarrow(entries[0].contentRect.width<620));resize.observe(container.current);
  const media=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setSystemReduced(media.matches);media.addEventListener('change',change);
  return()=>{resize.disconnect();media.removeEventListener('change',change);};
 },[]);
 useEffect(()=>{
  const instance=player.current;if(!instance)return;let request=0;
  const update:CallbackListener<'timeupdate'>=event=>setFrame(event.detail.frame),seek:CallbackListener<'seeked'>=event=>setFrame(event.detail.frame);
  const onPlay:CallbackListener<'play'>=()=>setPlaying(true),onPause:CallbackListener<'pause'>=()=>setPlaying(false);
  const ended:CallbackListener<'ended'>=()=>{instance.seekTo(DISCORD_LOOP_START);request=requestAnimationFrame(()=>{if(wantsPlay.current&&motionAllowed.current&&visible.current)instance.play();});};
  instance.addEventListener('timeupdate',update);instance.addEventListener('seeked',seek);instance.addEventListener('play',onPlay);instance.addEventListener('pause',onPause);instance.addEventListener('ended',ended);
  return()=>{cancelAnimationFrame(request);instance.removeEventListener('timeupdate',update);instance.removeEventListener('seeked',seek);instance.removeEventListener('play',onPlay);instance.removeEventListener('pause',onPause);instance.removeEventListener('ended',ended);};
 },[]);
 useEffect(()=>{if(reducedMotion){player.current?.pause();player.current?.seekTo(120);setTour(false);}else if(wantsPlay.current&&visible.current)player.current?.play();},[reducedMotion]);
 useEffect(()=>{
  if(!container.current)return;let intersecting=true;
  const sync=()=>{visible.current=intersecting&&!document.hidden;if(!visible.current)player.current?.pause();else if(wantsPlay.current&&motionAllowed.current)player.current?.play();};
  const observer=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(container.current);document.addEventListener('visibilitychange',sync);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[]);
 const inputProps=useMemo(()=>({mobile,reducedMotion,selected,tour,inviteUrl,symbolSrc,onSelect:select}),[mobile,reducedMotion,selected,tour,inviteUrl,symbolSrc,select]);
 const channel=CHANNELS.find(item=>item.id===selected);
 return <div className="discord-community" ref={container}>
  <div role="region" aria-label="Explore the Discord community: workshops, group discussions, networking, project help, announcements, and questions.">
   <Player ref={player} component={DiscordScene} inputProps={inputProps} compositionWidth={mobile?600:1120} compositionHeight={mobile?1040:680} fps={DISCORD_FPS} durationInFrames={DISCORD_DURATION} initialFrame={reducedMotion?120:0} autoPlay={autoPlay&&!reducedMotion} loop={false} controls={false} moveToBeginningWhenEnded={false} clickToPlay={false} doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false} initiallyMuted numberOfSharedAudioTags={0} style={{width:'100%'}} errorFallback={()=><div className="dc-load-error">The preview could not load. Please refresh the page.</div>}/>
  </div>
  {showControls&&<div className="dc-playback">
   <button type="button" className="dc-play-toggle" disabled={reducedMotion} aria-label={playing?'Pause Discord animation':'Play Discord animation'} onClick={()=>{if(player.current?.isPlaying())pause();else{wantsPlay.current=true;player.current?.play();}}}><Icon name={playing?'pause':'play'} size={15}/></button>
   <button type="button" className="dc-replay" aria-label="Replay Discord entrance" disabled={reducedMotion} onClick={replay}><Icon name="replay" size={16}/></button>
   <span className="dc-play-time">{(frame/DISCORD_FPS).toFixed(1)}<span> / 14.0 s</span></span>
   <input className="dc-timeline" aria-label="Discord animation timeline" type="range" min="0" max={DISCORD_DURATION-1} value={frame} disabled={reducedMotion} style={{'--dc-progress':frame/(DISCORD_DURATION-1)*100+'%'} as React.CSSProperties} onChange={event=>{pause();player.current?.seekTo(Number(event.target.value));}}/>
   <button type="button" className={'dc-tour '+(tour?'dc-tour-on':'')} disabled={reducedMotion} aria-pressed={tour} onClick={()=>{setSelected(null);onChannelChange?.(null);setTour(value=>!value);if(!player.current?.isPlaying()){wantsPlay.current=true;player.current?.play();}}}><Icon name="motion" size={15}/><span>{tour?'Stop tour':'Tour channels'}</span></button>
  </div>}
  {!onChannelChange&&channel&&<div className="dc-inline-detail" aria-live="polite"><span style={{background:channel.pale,color:channel.color}}><Icon name={channel.icon}/></span><div><strong>{channel.label}</strong><p>{channel.description}</p></div></div>}
 </div>;
});

