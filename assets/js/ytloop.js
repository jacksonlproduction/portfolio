// Muted, looping, control-free YouTube players for hover previews (reel frames and work cards).
// YTLoop.create(id) returns { el, destroy() }. The element gets .live once the video is actually
// playing, so nobody sees YouTube's loading screen; style .yt-loop / .yt-loop.live to fade it in.
(() => {
  const ORIGIN = /^https?:/.test(location.origin) ? location.origin : '';
  const live = new Map();   // iframe window → wrapper element
  let n = 0;

  addEventListener('message', e => {
    if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin || 'http://x').hostname)) return;
    const el = live.get(e.source);
    if (!el) return;
    let d = e.data;
    try { if (typeof d === 'string') d = JSON.parse(d); } catch (_) { return; }
    const state = d && (d.event === 'onStateChange' ? d.info : d.info && d.info.playerState);
    if (state === 1) el.classList.add('live');
  });

  function create(id) {
    const el = document.createElement('div');
    el.className = 'yt-loop';
    el.setAttribute('aria-hidden', 'true');
    const f = document.createElement('iframe');
    const q = new URLSearchParams({
      autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: id, playsinline: 1, rel: 0,
      modestbranding: 1, iv_load_policy: 3, disablekb: 1, fs: 0, enablejsapi: 1, widget_referrer: location.href,
    });
    if (ORIGIN) q.set('origin', ORIGIN);
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${q}`;
    f.title = '';
    f.tabIndex = -1;
    f.allow = 'autoplay; encrypted-media';
    const key = ++n;
    f.addEventListener('load', () => {
      live.set(f.contentWindow, el);
      // ask the player to report its state changes back to us
      const hello = () => f.contentWindow && f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: key, channel: 'widget' }), '*');
      hello(); setTimeout(hello, 400);
    });
    // if the state messages never arrive, show it anyway once it has had time to start
    const fallback = setTimeout(() => el.classList.add('live'), 3200);
    el.append(f);
    return {
      el,
      destroy() {
        clearTimeout(fallback);
        if (f.contentWindow) live.delete(f.contentWindow);
        el.remove();
      },
    };
  }

  window.YTLoop = { create };
})();
