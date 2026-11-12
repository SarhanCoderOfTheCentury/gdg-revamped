(() => {
  const targets = [...document.querySelectorAll('[data-remotion-component]')];
  if (!targets.length) return;
  let modulePromise;
  function load(element) {
    if (element.dataset.mountState) return;
    element.dataset.mountState = 'loading';
    modulePromise ??= import('/assets/remotion/islands.js?v=4');
    modulePromise.then(module => {
      element.replaceChildren();
      if (element.dataset.remotionComponent === 'community') module.mountCommunity(element);
      else module.mountDiscord(element);
      element.dataset.mountState = 'ready';
    }).catch(() => {
      element.dataset.mountState = 'error';
      const message = document.createElement('p');
      message.className = 'component-loading';
      message.textContent = 'This interactive component could not load. Please refresh the page.';
      element.replaceChildren(message);
    });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          load(entry.target);
          observer.unobserve(entry.target);
        }
      }
    }, {rootMargin: '320px 0px'});
    targets.forEach(element => observer.observe(element));
  } else targets.forEach(load);
})();
