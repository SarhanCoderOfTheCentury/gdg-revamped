(()=>{
 const config=window.GDG_CONFIG;if(!config?.posthogKey)return;
 const read=()=>{try{return localStorage.getItem('gdg-analytics-consent')}catch{return null}};
 const save=v=>{try{localStorage.setItem('gdg-analytics-consent',v)}catch{}};
 let stop,generation=0;
 async function enable(){const request=++generation;try{const {startAnalytics}=await import('/assets/analytics/analytics.js');if(request!==generation||read()!=='accepted')return;stop=startAnalytics(config.posthogKey,config.posthogHost);}catch{console.warn('Analytics is unavailable; the website remains usable.');}}
 function prompt(){if(document.querySelector('.analytics-choice'))return;const box=document.createElement('aside');box.className='analytics-choice';box.setAttribute('aria-label','Analytics preferences');const p=document.createElement('p');p.textContent='Allow anonymous usage analytics to help improve this community website?';box.append(p);for(const [label,value]of[['Allow analytics','accepted'],['No thanks','declined']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{save(value);box.remove();if(value==='accepted')enable();});box.append(b);}document.body.append(box);}
 const button=document.createElement('button');button.type='button';button.className='analytics-preferences';button.textContent='Analytics preferences';button.addEventListener('click',()=>{generation++;stop?.();save('declined');prompt();});document.querySelector('footer')?.append(button);
 if(read()==='accepted')enable();else if(!read())prompt();
})();
