'use client';

import {Player, type PlayerRef, type CallbackListener} from '@remotion/player';
import {forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {CommunityScene, DURATION, FPS, LOOP_START, GROUPS, type GroupId, type SceneTheme} from './CommunityScene';
import {IDEAS, nextIdeaIndex} from './interaction-model';
import {Icon} from './Icon';
import './community-motion.css';

export interface CommunityMotionHandle {replay: () => void; pause: () => void; spark: () => void; reset: () => void;}
export interface CommunityMotionProps {
  theme?: SceneTheme;
  layout?: 'auto' | 'desktop' | 'mobile';
  activeGroup?: GroupId | null;
  onActiveGroupChange?: (id: GroupId | null) => void;
  onSpark?: () => void;
  interactive?: boolean;
  reducedMotion?: boolean;
  playbackRate?: number;
  showControls?: boolean;
  assetSrc?: string;
  autoPlay?: boolean;
}

/** A responsive, embeddable Remotion scene. Its ambient loop skips the entrance. */
export const CommunityMotion = memo(forwardRef<CommunityMotionHandle, CommunityMotionProps>(function CommunityMotion({theme = 'light', layout = 'auto', activeGroup: controlledGroup, onActiveGroupChange, onSpark, interactive = true, reducedMotion: reducedOverride, playbackRate = 1, showControls = false, assetSrc = '/assets/community-sculpture.webp', autoPlay = true}, ref) {
  const player = useRef<PlayerRef>(null);
  const container = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [error, setError] = useState(false);
  const [localGroup, setLocalGroup] = useState<GroupId | null>(null);
  const [sparkId, setSparkId] = useState(0);
  const [localIdea, setLocalIdea] = useState(0);
  const [resetVersion, setResetVersion] = useState(0);
  const activeGroup = controlledGroup === undefined ? localGroup : controlledGroup;
  const selectGroup = useCallback((id: GroupId | null) => {setLocalGroup(id); onActiveGroupChange?.(id);}, [onActiveGroupChange]);
  const spark = useCallback(() => {setSparkId(value => value + 1); setLocalIdea(value => nextIdeaIndex(value, Math.random())); selectGroup(null); onSpark?.();}, [selectGroup, onSpark]);
  const reset = useCallback(() => {setResetVersion(value => value + 1); selectGroup(null);}, [selectGroup]);
  const requestedPlay = useRef(autoPlay);
  const visible = useRef(true);
  const reducedMotion = reducedOverride ?? systemReduced;
  const motionAllowed = useRef(!reducedMotion);
  motionAllowed.current = !reducedMotion;
  const mobile = layout === 'mobile' || (layout === 'auto' && narrow);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = new ResizeObserver(entries => setNarrow(entries[0].contentRect.width < 620));
    resize.observe(element);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => {resize.disconnect(); media.removeEventListener('change', onChange);};
  }, []);

  useEffect(() => {
    const instance = player.current;
    if (!instance) return;
    const update: CallbackListener<'timeupdate'> = event => setFrame(event.detail.frame);
    const seek: CallbackListener<'seeked'> = event => setFrame(event.detail.frame);
    const play: CallbackListener<'play'> = () => setPlaying(true);
    const pause: CallbackListener<'pause'> = () => setPlaying(false);
    let loopRequest = 0;
    const ended: CallbackListener<'ended'> = () => {
      instance.seekTo(LOOP_START);
      loopRequest = requestAnimationFrame(() => {
        if (requestedPlay.current && motionAllowed.current && visible.current) instance.play();
      });
    };
    instance.addEventListener('timeupdate', update);
    instance.addEventListener('seeked', seek);
    instance.addEventListener('play', play);
    instance.addEventListener('pause', pause);
    instance.addEventListener('ended', ended);
    return () => {cancelAnimationFrame(loopRequest); instance.removeEventListener('timeupdate', update); instance.removeEventListener('seeked', seek); instance.removeEventListener('play', play); instance.removeEventListener('pause', pause); instance.removeEventListener('ended', ended);};
  }, []);

  useEffect(() => {
    if (reducedMotion) {player.current?.pause(); player.current?.seekTo(120);}
    else if (requestedPlay.current && visible.current) player.current?.play();
  }, [reducedMotion]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let intersecting = true;
    const synchronize = () => {
      visible.current = intersecting && !document.hidden;
      if (!visible.current) player.current?.pause();
      else if (requestedPlay.current && motionAllowed.current) player.current?.play();
    };
    const observer = new IntersectionObserver(entries => {intersecting = entries[0].isIntersecting; synchronize();}, {threshold: .1});
    observer.observe(element);
    document.addEventListener('visibilitychange', synchronize);
    return () => {observer.disconnect(); document.removeEventListener('visibilitychange', synchronize);};
  }, []);

  const replay = () => {if (reducedMotion) return; player.current?.seekTo(0); requestedPlay.current = true; player.current?.play();};
  const pause = () => {requestedPlay.current = false; player.current?.pause();};
  useImperativeHandle(ref, () => ({replay, pause, spark, reset}));
  const inputProps = useMemo(() => ({mobile, theme, activeGroup, reducedMotion, assetSrc, interactive, onSelectGroup: selectGroup, onSpark: spark, sparkId, resetVersion}), [mobile, theme, activeGroup, reducedMotion, assetSrc, interactive, selectGroup, spark, sparkId, resetVersion]);

  return <div ref={container} className={`community-motion ${theme}`}>
    <div className="cm-canvas" role="region" aria-label="Interactive community canvas. Explore an activity card or spark an idea with the centerpiece.">
      <Player ref={player} component={CommunityScene} compositionWidth={mobile ? 600 : 1120} compositionHeight={mobile ? 840 : 660} fps={FPS} durationInFrames={DURATION} inputProps={inputProps} autoPlay={autoPlay && !reducedMotion} initialFrame={reducedMotion ? 120 : 0} controls={false} loop={false} moveToBeginningWhenEnded={false} playbackRate={playbackRate} clickToPlay={false} doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false} numberOfSharedAudioTags={0} initiallyMuted style={{width: '100%'}} errorFallback={() => {if (!error) queueMicrotask(() => setError(true)); return <div className="cm-error">The animation could not load. Please reload the preview.</div>;}} />
    </div>
    {!onActiveGroupChange && activeGroup && <div className="cm-local-detail" aria-live="polite"><Icon name={GROUPS.find(group => group.id === activeGroup)!.icon}/><div><strong>{GROUPS.find(group => group.id === activeGroup)!.title}</strong><p>{GROUPS.find(group => group.id === activeGroup)!.description}</p></div></div>}
    {!onSpark && sparkId > 0 && <div className="cm-local-idea" aria-live="polite"><span>A LITTLE POSSIBILITY</span><h3>{IDEAS[localIdea].title}</h3><ol>{IDEAS[localIdea].steps.map(step => <li key={step}>{step}</li>)}</ol><button type="button" onClick={spark}><Icon name="replay" size={14}/>Mix another</button></div>}
    {showControls && <div className="cm-controls">
      <button type="button" className="cm-play" disabled={reducedMotion || error} aria-label={playing ? 'Pause animation' : 'Play animation'} title={playing ? 'Pause animation' : 'Play animation'} onClick={() => {if (player.current?.isPlaying()) pause(); else {requestedPlay.current = true; player.current?.play();}}}><Icon name={playing ? 'pause' : 'play'} size={16}/></button>
      <button type="button" className="cm-replay" disabled={reducedMotion || error} aria-label="Replay entrance" title="Replay entrance" onClick={replay}><Icon name="replay" size={17}/></button>
      <span className="cm-time" aria-hidden="true">{(frame / FPS).toFixed(1)}<span> / 12.0 s</span></span>
      <input aria-label="Animation timeline" className="cm-timeline" type="range" min="0" max={DURATION - 1} step="1" value={frame} disabled={reducedMotion || error} style={{'--progress': `${frame / (DURATION - 1) * 100}%`} as React.CSSProperties} onChange={event => {pause(); player.current?.seekTo(Number(event.target.value));}}/>
      <span className="cm-loop"><span/>{reducedMotion ? 'Still frame' : 'Ambient loop'}</span>
    </div>}
  </div>;
}));
