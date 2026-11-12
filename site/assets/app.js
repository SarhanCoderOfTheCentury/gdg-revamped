(() => {
  'use strict';
  document.documentElement.dataset.runtime = 'starting';
  const data = window.SITE_DATA;
  if (!data) { document.documentElement.dataset.runtime = 'missing-data'; return; }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const dateFormat = new Intl.DateTimeFormat('en-US', {month:'short',day:'numeric',year:'numeric',timeZone:'Asia/Karachi'});
  const date = value => value ? dateFormat.format(new Date(value)) : '';
  const imageMap = window.SITE_IMAGES || {};
  const photo = (src, alt, attributes = '') => {
    const item = imageMap[src];
    const full = attributes.includes('album-photo') || attributes.includes('story-image');
    const thumb = attributes.includes('album-thumb');
    const url = item ? (thumb ? item.thumb || item.small : full ? src : item.small || item.medium) || src : src;
    const responsive = item && !full && !thumb && item.medium && item.small !== item.medium
      ? ` srcset="${escape(item.small || src)} ${Math.min(480,item.width)}w, ${escape(item.medium)} ${Math.min(960,item.width)}w" sizes="(max-width:640px) 90vw, 400px"` : '';
    const dimensions = item ? ` width="${item.width}" height="${item.height}"` : '';
    const loading = attributes.includes('loading=') ? '' : ' loading="lazy"';
    return `<img src="${escape(url || '/assets/portrait-placeholder.svg')}" alt="${escape(alt)}"${responsive}${dimensions}${loading} decoding="async" ${attributes}>`;
  };
  const menuButton = $('header button[aria-controls="mobile-menu"]');
  const mobileMenu = $('#mobile-menu');
  function closeMenu() { if (mobileMenu) mobileMenu.hidden = true; menuButton?.setAttribute('aria-expanded','false'); menuButton?.setAttribute('aria-label','Open menu'); }
  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    mobileMenu.hidden = expanded;
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
  });
  mobileMenu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  matchMedia('(min-width:961px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const dialog = $('#site-dialog');
  const content = $('#dialog-content');
  let albumState = null;
  let returnFocus = null;
  function showDialog(markup) {
    if (!dialog.open) returnFocus = document.activeElement;
    content.innerHTML = markup;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds=dialog.getBoundingClientRect(); if (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => {
    albumState = null;
    document.body.style.overflow = '';
    const url = new URL(location.href);
    if (url.searchParams.has('album') || url.searchParams.has('event')) {
      url.searchParams.delete('album'); url.searchParams.delete('photo'); url.searchParams.delete('event');
      history.replaceState(null, '', url);
    }
    returnFocus?.focus({preventScroll:true});
  });
  function openEvent(event) {
    albumState = null;
    showDialog(`<div class="detail-layout">${photo(event.image, event.title,'class="detail-image"')}<div class="detail-copy"><span class="event-category">${escape(event.category || 'workshop')}</span><h2>${escape(event.title)}</h2><time>${date(event.date)}</time>${event.venue ? `<p class="detail-venue">${escape(event.venue)}</p>` : ''}<p class="detail-description">${escape(event.description)}</p>${event.speakers?.length ? `<p class="detail-speakers">${event.speakers.map(s => escape(s.name)).join(' · ')}</p>` : ''}${event.photos?.length ? '<button class="primary-action" type="button" id="detail-photos">View event photos →</button>' : ''}</div></div>`);
    $('#detail-photos')?.addEventListener('click', () => openAlbum(event));
  }
  function openAlbum(event, start = 0) {
    if (!event.photos?.length) { openEvent(event); return; }
    albumState = { event, index: Math.max(0, Math.min(start,event.photos.length-1)) };
    showDialog(`<div class="album-shell"><h2 class="album-title">${escape(event.title)}</h2><p class="album-meta">${date(event.date)}${event.venue ? ' · '+escape(event.venue) : ''}</p><div class="album-photo-wrap">${photo(event.photos[albumState.index],event.title,'class="album-photo" id="album-photo"')}${event.photos.length > 1 ? '<button class="album-arrow previous" type="button" aria-label="Previous photo">‹</button><button class="album-arrow next" type="button" aria-label="Next photo">›</button>' : ''}</div><p class="album-counter" role="status" aria-live="polite"></p><div class="album-thumbs" aria-label="Album photos">${event.photos.map((src,index) => `<button type="button" data-photo="${index}" aria-label="View photo ${index+1}">${photo(src, 'Photo '+(index+1),'class="album-thumb" loading="lazy"')}</button>`).join('')}</div></div>`);
    $('.album-arrow.previous')?.addEventListener('click', () => stepPhoto(-1));
    $('.album-arrow.next')?.addEventListener('click', () => stepPhoto(1));
    $$('.album-thumbs button').forEach(button => button.addEventListener('click', () => { albumState.index=Number(button.dataset.photo); renderPhoto(); }));
    renderPhoto();
  }
  function renderPhoto() {
    const {event,index} = albumState;
    $('#album-photo').src=event.photos[index];
    $('#album-photo').alt=`${event.title} — photo ${index+1} of ${event.photos.length}`;
    $('.album-counter').textContent=`${index+1} / ${event.photos.length}`;
    $$('.album-thumbs button').forEach((button,i) => button.setAttribute('aria-current',String(i===index)));
    const selected=$('.album-thumbs button[aria-current="true"]');
    selected?.scrollIntoView({behavior:'instant',block:'nearest',inline:'nearest'});
  }
  function stepPhoto(direction) { if (!albumState) return; const length=albumState.event.photos.length; albumState.index=(albumState.index+direction+length)%length;renderPhoto(); }
  document.addEventListener('keydown', event => {
    if (!dialog.open || !albumState || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) return;
    if (event.key==='ArrowLeft' || event.key==='ArrowRight') { event.preventDefault();stepPhoto(event.key==='ArrowRight'?1:-1); }
  });

  const eventStage = $('#event-carousel');
  if (eventStage) {
    let index=0;
    const items=data.homeEvents;
    function renderEvents() {
      eventStage.innerHTML = [-1,0,1].map(offset => {
        const item=items[(index+offset+items.length)%items.length];
        return `<article class="rebuild-slide ${offset===0?'is-center':offset===-1?'is-left':'is-right'}" ${offset ? `role="button" tabindex="0" aria-label="Show ${escape(item.title)}" data-offset="${offset}"` : ''}>${photo(item.image,item.title)}<div class="slide-info"><div class="slide-info-header"><div><h3>${escape(item.title)}</h3><p class="slide-date">${date(item.date)}</p></div><button class="slide-expand" type="button" aria-label="Expand ${escape(item.title)}">↗ Expand</button></div><p class="slide-description">${escape(item.description)}</p></div></article>`;
      }).join('');
      $$('.rebuild-slide[data-offset]',eventStage).forEach(card => {
        const select=()=>{ index=(index+Number(card.dataset.offset)+items.length)%items.length;renderEvents(); };
        card.addEventListener('click',select);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}});
      });
      $('.is-center .slide-expand',eventStage).addEventListener('click',()=>openEvent(items[index]));
      const rail=$('#event-thumbnails');
      rail.innerHTML=items[index].photos.filter(Boolean).map((src,i)=>`<button type="button" aria-label="View ${escape(items[index].title)} photo ${i+1}">${photo(src,'Workshop session','loading="lazy"')}</button>`).join('');
      $$('button',rail).forEach((button,i)=>button.addEventListener('click',()=>openAlbum(items[index],i)));
    }
    $$('[data-event-step]').forEach(button=>button.addEventListener('click',()=>{index=(index+Number(button.dataset.eventStep)+items.length)%items.length;renderEvents();}));
    renderEvents();
  }
  const speakerStage=$('#speaker-carousel');
  if (speakerStage) {
    const items=data.speakers.filter(s=>s.image).slice(0,23);
    let index=Math.max(0,items.findIndex(s=>s.name==='Sakina Abbas'));
    function renderSpeakers() {
      speakerStage.innerHTML = [-1,0,1].map(offset=>{
        const item=items[(index+offset+items.length)%items.length];
        return `<article class="rebuild-slide ${offset===0?'is-center':offset===-1?'is-left':'is-right'}" ${offset?`role="button" tabindex="0" aria-label="Show ${escape(item.name)}" data-offset="${offset}"`:''}>${photo(item.image,item.name)}<div class="slide-info"><h3>${escape(item.name)}</h3><p class="speaker-role">${escape(item.role)}</p>${item.linkedin?`<a class="speaker-link" href="${escape(item.linkedin)}" target="_blank" rel="noopener noreferrer">LINKEDIN ↗</a>`:''}</div></article>`;
      }).join('');
      const item=items[index];
      $('#speaker-label').innerHTML=`${photo(item.image,item.name,'class="speaker-label-img"')}<div><p class="speaker-label-name">${escape(item.name)}</p><p class="speaker-label-sub">Speaker info</p></div>`;
      $$('.rebuild-slide[data-offset]',speakerStage).forEach(card=>{
        const select=()=>{index=(index+Number(card.dataset.offset)+items.length)%items.length;renderSpeakers();};
        card.addEventListener('click',select);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}});
      });
    }
    $$('[data-speaker-step]').forEach(button=>button.addEventListener('click',()=>{index=(index+Number(button.dataset.speakerStep)+items.length)%items.length;renderSpeakers();}));
    if(items.length)renderSpeakers();
  }


  const results=$('#event-results');
  if(results) {
    let filter='upcoming';
    const search=$('input[aria-label="Search events"]');
    const year=$('select[aria-label="Filter by year"]');
    year.replaceChildren(new Option('All Years','All'),...([...new Set(data.events.map(e=>e.date?.slice(0,4)).filter(Boolean))].sort().reverse().map(value=>new Option(value,value))));
    function renderResults() {
      const now=Date.now();
      const query=search.value.trim().toLowerCase();
      const items=data.events.filter(e=>{
        const past=new Date(e.endDate || e.date).getTime()<now;
        return (filter==='past'?past:!past) && (year.value==='All'||e.date?.startsWith(year.value)) && (!query||[e.title,e.description,e.venue,e.category].join(' ').toLowerCase().includes(query));
      });
      $$('[data-event-filter]').forEach(button=>{const active=button.dataset.eventFilter===filter;button.style.background=active?'#0089f7':'transparent';button.style.color=active?'#fff':'#565555';button.setAttribute('aria-pressed',String(active));});
      if(!items.length) {
        results.innerHTML=`<div class="events-empty"><h2>No ${filter} events found.</h2><p>${query||year.value!=='All'?'Try another search or year.':'Check back soon for more GDG DSU events!'}</p>${query||year.value!=='All'?'<button type="button" id="clear-filters">Clear filters</button>':''}</div>`;
        $('#clear-filters')?.addEventListener('click',()=>{search.value='';year.value='All';renderResults();});
        return;
      }
      if(filter==='past')items.sort((a,b)=>new Date(b.date)-new Date(a.date));else items.sort((a,b)=>new Date(a.date)-new Date(b.date));
      results.innerHTML=`<p class="event-result-count">${items.length} ${items.length===1?'event':'events'}</p><div class="event-grid">${items.map(e=>`<article class="event-card">${photo(e.image || e.photos[0],e.title,'class="event-cover" loading="lazy"')}<div class="event-card-body"><span class="event-category">${escape(e.category)}</span><time datetime="${escape(e.date)}">${date(e.date)}</time><h2>${escape(e.title)}</h2><p class="event-venue">${escape(e.venue)}</p><button class="event-open" type="button" data-open-event="${escape(e.id)}" aria-label="View ${escape(e.title)} details">View event →</button></div></article>`).join('')}</div>`;

    }
    $$('[data-event-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.eventFilter;renderResults();}));
    search.addEventListener('input',renderResults);year.addEventListener('change',renderResults);
    renderResults();
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-event]');
    if (!trigger) return;
    const item = data.events.find(item => item.id === trigger.dataset.openEvent);
    if (item) openEvent(item);
  });

  $$('[data-album-id]').forEach(button=>button.addEventListener('click',()=>{
    const event=data.events.find(e=>e.id===button.dataset.albumId);
    if(event)openAlbum(event,Number(button.dataset.photoIndex)||0);
  }));
  $$('[data-story-open]').forEach(button=>button.addEventListener('click',()=>{
    albumState=null;
    const article=button.closest('article');
    const image=$('img',article),title=$('h3',article)?.textContent,description=$('p:nth-of-type(2)',button.parentElement)?.textContent;
    showDialog(`${photo(image.src,image.alt,'class="story-image"')}<div class="story-copy"><h2>${escape(title)}</h2><p>${escape(description)}</p></div>`);
  }));
  $('[data-back]')?.addEventListener('click',()=>{if(document.referrer&&new URL(document.referrer).origin===location.origin)history.back();else location.href='/';});
  const form=$('#contact-form');
  form?.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const fields=new FormData(form);
    const name=[fields.get('first_name'),fields.get('last_name')].join(' ').trim();
    const subject=`Website inquiry from ${name}`;
    const body=`Name: ${name}\nEmail: ${fields.get('email')}\nOrganization: ${fields.get('institution')||'—'}\nPhone: ${fields.get('phone_number')||'—'}\n\n${fields.get('message')}`;
    const mailto=`mailto:gdgcampus.dsu@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    location.href=mailto;
    const status=$('#contact-status');
    status.replaceChildren(document.createTextNode('Your message is ready. Complete sending it in your email app. '));
    const retry=document.createElement('a');retry.href=mailto;retry.textContent='Open email draft';retry.style.textDecoration='underline';status.append(retry);
  });
  const params=new URLSearchParams(location.search);
  const album=params.get('album'),eventId=params.get('event');
  if(album){const event=data.events.find(e=>e.id===album);if(event)openAlbum(event,Math.max(0,Number(params.get('photo')||1)-1));}
  else if(eventId){const event=data.events.find(e=>e.id===eventId);if(event)openEvent(event);}
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.setAttribute('data-ambient-visible', String(entry.isIntersecting));
    }, {rootMargin:'100px'});
    $$('[data-ambient-section]').forEach(section => {
      section.setAttribute('data-ambient-visible','false'); observer.observe(section);
    });
  }
  document.documentElement.dataset.runtime = 'ready';
})();
