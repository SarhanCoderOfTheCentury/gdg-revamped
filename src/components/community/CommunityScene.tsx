import {useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useCurrentScale, useVideoConfig} from 'remotion';
import {Icon, type IconName} from './Icon';
import {boundOffset, connectionPath, type Point} from './interaction-model';
export const FPS = 30;
export const DURATION = 360;
export const LOOP_START = 60;
export type GroupId = 'connect' | 'explore' | 'create' | 'build';
export type SceneTheme = 'light' | 'dark';
export const GROUPS: {id: GroupId; label: string; title: string; terms: string[]; color: string; pale: string; icon: IconName; description: string}[] = [
  {id: 'connect', label: 'Connect', title: 'Find your people.', terms: ['Mentorship', 'Teamwork'], color: '#4285f4', pale: '#edf3fe', icon: 'connect', description: 'A mentor to guide you. A team to grow with. Good connections make all the difference.'},
  {id: 'explore', label: 'Explore', title: 'Think out loud.', terms: ['Brainstorming', 'Problem solving'], color: '#e45848', pale: '#fdf0ed', icon: 'explore', description: 'Ask the interesting questions. Share the unfinished ideas. Find a new way forward, together.'},
  {id: 'create', label: 'Create', title: 'Give ideas a shape.', terms: ['Prototyping', 'UI / UX'], color: '#c68d0a', pale: '#fdf6e4', icon: 'create', description: 'Go from a sketch to something you can try. Design, prototype, and make your ideas tangible.'},
  {id: 'build', label: 'Build', title: 'Make it happen.', terms: ['Workshops', 'Hackathons'], color: '#278c51', pale: '#eaf5ee', icon: 'build', description: 'Get hands-on in a workshop. Take on a hackathon. Build something with the people beside you.'},
];


export type CommunitySceneProps = {
  mobile: boolean; theme: SceneTheme; activeGroup: GroupId | null; reducedMotion: boolean; assetSrc: string;
  interactive?: boolean; onSelectGroup?: (id: GroupId | null) => void; onSpark?: () => void; sparkId?: number; resetVersion?: number;
};
const initialOffsets = (): Point[] => Array.from({length: 4}, () => ({x: 0, y: 0}));
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
function Miniature({index, color}: {index: number; color: string}) {
  if (index === 0) return <div className="cm-mini cm-mini-people"><span>you</span><i/><span className="cm-mini-accent">us</span><i/><span>∞</span><small>Better, together.</small></div>;
  if (index === 1) return <div className="cm-mini cm-mini-notes"><i/><i/><i/><span>A good question changes everything.</span></div>;
  if (index === 2) return <div className="cm-mini cm-mini-ui"><div><i/><i/><i/></div><span style={{background: color}}/><small>From “what if” to “try this”.</small></div>;
  return <div className="cm-mini cm-mini-code"><span><b>build</b>(yourIdea);</span><i/><i/><i/></div>;
}
export function CommunityScene({mobile, theme, activeGroup, reducedMotion, assetSrc, interactive = true, onSelectGroup, onSpark, sparkId = 0, resetVersion = 0}: CommunitySceneProps) {
  const rawFrame = useCurrentFrame();
  const frame = reducedMotion ? 120 : rawFrame;
  const {fps} = useVideoConfig();
  const scale = useCurrentScale();
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{index: number; x: number; y: number; offset: Point; moved: boolean} | null>(null);
  const suppressClick = useRef(false);
  const raf = useRef(0);
  const [offsets, setOffsets] = useState(initialOffsets);
  const [hovered, setHovered] = useState<GroupId | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const dark = theme === 'dark';
  const width = mobile ? 600 : 1120;
  const height = mobile ? 840 : 660;
  const center = mobile ? {x: 300, y: 393} : {x: 560, y: 328};
  const cardWidth = mobile ? 254 : 268;
  const cardHeight = mobile ? 154 : 174;
  const positions = mobile ? [{x: 24, y: 100}, {x: 322, y: 100}, {x: 24, y: 594}, {x: 322, y: 594}] : [{x: 60, y: 118}, {x: 792, y: 118}, {x: 77, y: 402}, {x: 775, y: 402}];
  const ink = dark ? '#eff4f0' : '#223047';
  const muted = dark ? '#a6b6aa' : '#75849a';
  const line = dark ? '#354d42' : '#e1e8f2';
  const entrance = spring({fps, frame, config: {damping: 21, stiffness: 95, mass: .8}});
  const ambient = Math.max(0, frame - LOOP_START);
  const phase = ambient / (DURATION - LOOP_START) * Math.PI * 2;
  const floating = reducedMotion ? 0 : Math.sin(phase) * 7;
  const imageSize = mobile ? 346 : 420;
  const focus = activeGroup ?? hovered;
  useEffect(() => {setOffsets(initialOffsets()); setDragging(null); drag.current = null; suppressClick.current = false;}, [mobile, resetVersion]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (!interactive || (event.pointerType === 'mouse' && event.button !== 0)) return;
    suppressClick.current = false;
    drag.current = {index, x: event.clientX, y: event.clientY, offset: offsets[index], moved: false};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    const dx = (event.clientX - state.x) / scale;
    const dy = (event.clientY - state.y) / scale;
    if (Math.hypot(dx, dy) > 6) {state.moved = true; setDragging(state.index);}
    if (!state.moved) return;
    const next = boundOffset({x: state.offset.x + dx, y: state.offset.y + dy}, mobile);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setOffsets(previous => previous.map((point, i) => i === state.index ? next : point)));
  }
  function stopDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    suppressClick.current = drag.current?.moved ?? false;
    drag.current = null; setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function pointerScene(event: ReactPointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    root.current?.style.setProperty('--tilt-x', `${(y - .5) * -9}deg`);
    root.current?.style.setProperty('--tilt-y', `${(x - .5) * 11}deg`);
    root.current?.style.setProperty('--spot-x', `${x * 100}%`);
    root.current?.style.setProperty('--spot-y', `${y * 100}%`);
  }
  const paths = positions.map((pos, i) => {
    const offset = offsets[i];
    const start = mobile ? {x: pos.x + cardWidth / 2 + offset.x, y: pos.y + (i < 2 ? cardHeight : 0) + offset.y} : {x: pos.x + (i % 2 === 0 ? cardWidth : 0) + offset.x, y: pos.y + cardHeight / 2 + offset.y};
    const end = {x: center.x + (i % 2 === 0 ? -87 : 87), y: center.y + (i < 2 ? -42 : 61)};
    return connectionPath(start, end, mobile);
  });
  return <AbsoluteFill ref={root} className={`cm-scene ${reducedMotion ? 'cm-still' : ''}`} style={{background: dark ? '#11271e' : '#ffffff', color: ink}} onPointerMove={pointerScene} onPointerLeave={() => {root.current?.style.setProperty('--tilt-x', '0deg'); root.current?.style.setProperty('--tilt-y', '0deg'); setHovered(null);}} onKeyDown={event => {if (event.key === 'Escape') onSelectGroup?.(null);}}>
    <AbsoluteFill className="cm-grid"/><AbsoluteFill className="cm-pointer-light"/>
    <div className="cm-scene-top" style={{left: mobile ? 28 : 35, right: mobile ? 28 : 35, top: mobile ? 34 : 30, fontSize: mobile ? 14 : 10}}><span><i/>A SPACE FOR YOUR NEXT BIG THING</span><span>{mobile ? 'LET’S PLAY' : 'LEARN. EXPLORE. CREATE. REPEAT.'}</span></div>
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} aria-hidden="true">
      <circle cx={center.x} cy={center.y + 8} r={mobile ? 177 : 210} fill="none" stroke={line} strokeWidth="1"/>
      <circle cx={center.x} cy={center.y + 8} r={mobile ? 194 : 232} fill="none" stroke={line} strokeWidth="1" strokeDasharray="1 12" transform={`rotate(${reducedMotion ? 0 : Math.sin(phase) * 8} ${center.x} ${center.y + 8})`}/>
      {GROUPS.map((group, i) => {
        const radius = mobile ? 176 : 209;
        const angle = i * Math.PI / 2 + Math.sin(phase) * .09;
        return <g key={group.id}><circle cx={center.x + Math.cos(angle) * radius} cy={center.y + 8 + Math.sin(angle) * radius} r="4" fill={group.color} opacity=".8"/><path d={`M ${center.x - 8} ${center.y - radius - 8} h16 m-8-8v16`} stroke={line} transform={`rotate(${i * 90} ${center.x} ${center.y + 8})`}/></g>;
      })}
      {paths.map((d, i) => {
        const group = GROUPS[i];
        const emphasized = !focus || focus === group.id;
        const reveal = interpolate(frame, [8 + i * 5, 48 + i * 5], [0, 1], clamp);
        const travel = ((ambient + i * 75) % 300) / 300;
        return <g key={group.id} opacity={emphasized ? 1 : .2} style={{transition: 'opacity .25s'}}><path d={d} fill="none" stroke={line} strokeWidth="2"/><path d={d} pathLength="1" fill="none" stroke={group.color} strokeWidth={focus === group.id ? 3 : 1.8} strokeDasharray="1" strokeDashoffset={1 - reveal} opacity={focus === group.id ? 1 : .55}/>{!reducedMotion && <path d={d} pathLength="1" fill="none" stroke={group.color} strokeWidth="5" strokeLinecap="round" strokeDasharray=".014 1" strokeDashoffset={-travel} opacity={reveal}/>}</g>;
      })}
    </svg>
    <div className="cm-center" style={{position: 'absolute', width: imageSize, height: imageSize, left: center.x - imageSize / 2, top: center.y - imageSize / 2 - 12, opacity: entrance, transform: `translateY(${(1 - entrance) * 35 + floating}px) scale(${.88 + entrance * .12})`}}>
      <button type="button" className="cm-sculpture" aria-label="Spark a new idea" disabled={!interactive} onClick={onSpark}><Img src={assetSrc} pauseWhenLoading={false} alt="Four Google-colored code brackets forming a sculptural community centerpiece" style={{width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none'}}/></button>
      {sparkId > 0 && !reducedMotion && <div className="cm-spark-burst" key={sparkId} aria-hidden="true">{Array.from({length: 16}, (_, i) => <i key={i} style={{'--angle': `${i * 22.5}deg`, '--distance': `${160 + i % 3 * 25}px`, '--delay': `${i % 3 * 25}ms`, background: GROUPS[i % 4].color} as React.CSSProperties}/>)}<span/></div>}
    </div>
    <button type="button" className="cm-center-hint" style={{top: mobile ? 547 : 553, fontSize: mobile ? 17 : 12}} disabled={!interactive} onClick={onSpark}><span className="cm-four-dots">{GROUPS.map(group => <i key={group.id} style={{background: group.color}}/>)}</span>{sparkId ? 'Another spark? Tap to mix an idea' : 'Tap the centerpiece. Spark an idea.'}<Icon name="arrow" size={mobile ? 16 : 13}/></button>
    {GROUPS.map((group, i) => {
      const entry = spring({fps, frame: frame - 7 - i * 5, config: {damping: 19, stiffness: 130}});
      const position = positions[i];
      const selected = activeGroup === group.id;
      const raised = hovered === group.id || selected;
      return <button key={group.id} type="button" className={`cm-activity-card ${raised ? 'cm-raised' : ''} ${dragging === i ? 'cm-dragging' : ''}`} data-activity={group.id} aria-label={`Explore ${group.label}: ${group.terms.join(' and ')}`} aria-pressed={selected} disabled={!interactive} onFocus={() => setHovered(group.id)} onBlur={() => setHovered(null)} onPointerEnter={() => setHovered(group.id)} onPointerLeave={() => {if (!drag.current) setHovered(null);}} onPointerDown={event => startDrag(event, i)} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onClick={() => {if (!suppressClick.current) onSelectGroup?.(selected ? null : group.id); suppressClick.current = false;}} style={{'--card-color': group.color, '--card-pale': group.pale, left: position.x + offsets[i].x, top: position.y + offsets[i].y, width: cardWidth, height: cardHeight, padding: '17px 20px', opacity: entry * (focus && focus !== group.id ? .55 : 1), transform: `translateY(${(1 - entry) * 28 + (raised && !reducedMotion ? -7 : 0)}px) rotate(${raised && !reducedMotion ? (i % 2 ? .8 : -.8) : 0}deg)`, zIndex: dragging === i ? 6 : raised ? 4 : 3, fontFamily: 'inherit'} as React.CSSProperties}>
        <div className="cm-card-meta" style={{fontSize: mobile ? 14 : 10}}><span><Icon name={group.icon} size={mobile ? 19 : 15}/>{group.label}</span><span className="cm-grip" aria-hidden="true">⠿</span></div>
        <div className="cm-card-title" style={{fontSize: mobile ? 25 : 24}}>{mobile && group.id === 'create' ? 'Shape your ideas.' : group.title}</div>
        <div className="cm-card-terms" style={{flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', gap: mobile ? 3 : 7, fontSize: mobile ? 18 : 12}}><span>{group.terms[0]}</span>{!mobile && <i/>}<span>{group.terms[1]}</span></div>
        {!mobile && <Miniature index={i} color={group.color}/>}<span className="cm-card-corner" aria-hidden="true"><Icon name="arrow" size={12}/></span>
      </button>;
    })}
    <div className="cm-scene-footer" style={{bottom: mobile ? 28 : 25, left: mobile ? 28 : 35, right: mobile ? 28 : 35, fontSize: mobile ? 15 : 10, color: muted}}><span>{interactive ? mobile ? 'Tap a card. Follow your curiosity.' : 'HOVER TO DISCOVER · DRAG TO PLAY · TAP TO CONNECT' : 'LEARN. BUILD. BELONG.'}</span><button type="button" onClick={() => {setOffsets(initialOffsets()); onSelectGroup?.(null);}} disabled={!interactive} aria-label="Reset card positions" style={{color: ink}}><Icon name="replay" size={mobile ? 18 : 13}/><span>Reset</span></button></div>
  </AbsoluteFill>;
}
