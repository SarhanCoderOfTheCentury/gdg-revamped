import posthog from 'posthog-js';
export function startAnalytics(key:string,host:string){
 posthog.init(key,{api_host:host,autocapture:false,capture_pageview:true,capture_pageleave:true,person_profiles:'identified_only',disable_session_recording:true,mask_all_text:true,mask_all_element_attributes:true});
 posthog.opt_in_capturing();
 const onClick=(event:Event)=>{
  const el=(event.target as Element)?.closest('a,button');if(!el)return;
  const href=el.getAttribute('href')||'';
  if(href.includes('discord.gg/'))posthog.capture('discord_join_clicked');
  else if(href==='/gallery')posthog.capture('gallery_opened');
  else if(href.includes('gdg.community.dev/'))posthog.capture('community_join_clicked');
  else if(el.hasAttribute('data-open-event'))posthog.capture('event_details_opened',{event_id:el.getAttribute('data-open-event')});
  else if(el.hasAttribute('data-album-id'))posthog.capture('gallery_album_opened',{event_id:el.getAttribute('data-album-id')});
 };
 document.addEventListener('click',onClick);
 return ()=>{document.removeEventListener('click',onClick);posthog.opt_out_capturing();posthog.reset();};
}
