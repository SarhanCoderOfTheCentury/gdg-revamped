import type {CSSProperties} from 'react';

export type IconName = 'connect' | 'explore' | 'create' | 'build' | 'play' | 'pause' | 'replay' | 'sun' | 'moon' | 'desktop' | 'mobile' | 'download' | 'arrow' | 'code' | 'check' | 'copy' | 'motion' | 'message' | 'bell' | 'question';

export function Icon({name, size = 20, style}: {name: IconName; size?: number; style?: CSSProperties}) {
  const paths: Record<IconName, React.ReactNode> = {
    connect: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    explore: <><path d="M9 18h6m-5 3h4M8.1 14.5a6 6 0 1 1 7.8 0c-.6.5-.9 1-.9 1.5H9c0-.5-.3-1-.9-1.5Z"/><path d="M12 1v1M3 4l1 1m16-1-1 1M1 11h1m20 0h1"/></>,
    create: <><path d="m16 3 5 5L9 20l-6 1 1-6Z"/><path d="m13 6 5 5M4 15l5 5"/></>,
    build: <><path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3"/></>,
    replay: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    moon: <path d="M21 12.8A9 9 0 0 1 11.2 3 9 9 0 1 0 21 12.8Z"/>,
    desktop: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></>,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/></>,
    check: <path d="m5 12 4 4L20 5"/>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
    motion: <><path d="M3 6h9m-9 6h5m-5 6h9"/><path d="m13 6 8 6-8 6Z"/></>,
    message: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 1 1 21 11.5Z"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    question: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0, ...style}} aria-hidden="true">{paths[name]}</svg>;
}

export function CommunityMark({size = 36}: {size?: number}) {
  return <svg width={size} height={size * .65} viewBox="0 0 60 39" fill="none" aria-hidden="true"><path d="M23 5 7 19" stroke="#EA4335" strokeWidth="9" strokeLinecap="round"/><path d="m7 19 16 14" stroke="#4285F4" strokeWidth="9" strokeLinecap="round"/><path d="m37 5 16 14" stroke="#FBBC05" strokeWidth="9" strokeLinecap="round"/><path d="M53 19 37 33" stroke="#34A853" strokeWidth="9" strokeLinecap="round"/></svg>;
}
