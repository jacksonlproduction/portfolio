// Contact: the project form is the only way in. Messages go to Formspree (formspree.io), which
// forwards them to the inbox on your Formspree account; manage the form and spam settings there.
const FORM_ENDPOINT = 'https://formspree.io/f/mnpjdbba';

(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ───────── Form ─────────
     Only a name and a way to reach you are required. Drafts are kept in this browser until sent,
     and "Want one like this?" in the video player pre-fills the form (contact:prefill event or ?like=). */
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('cf-status');
  const send = document.getElementById('cf-send');
  const label = send.querySelector('.send-label');
  const done = document.getElementById('cf-done');
  const DEFAULT_STATUS = status.textContent;
  const DRAFT = 'jl-contact-draft';

  const el = id => document.getElementById(id);
  const val = id => el(id).value.trim();
  const say = (msg, isError) => {
    status.textContent = msg;
    status.classList.toggle('error', !!isError);
  };
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = v => /^[+()\d\s.-]{7,}$/.test(v) && v.replace(/\D/g, '').length >= 7;

  const RULES = {
    'cf-name': [v => v.length > 0, 'Add your name so I know who to reply to.'],
    'cf-email': [v => isEmail(v) || isPhone(v), 'Add an email address or a phone number.'],
  };
  function checkField(id) {
    const [ok, msg] = RULES[id];
    const good = ok(val(id));
    const input = el(id);
    input.closest('.field').classList.toggle('invalid', !good);
    input.setAttribute('aria-invalid', good ? 'false' : 'true');
    el(id + '-err').textContent = good ? '' : msg;
    return good;
  }
  function validate() {
    const bad = Object.keys(RULES).filter(id => !checkField(id));
    if (bad.length) { say('Almost there: just fill in the highlighted field' + (bad.length > 1 ? 's' : '') + '.', true); el(bad[0]).focus(); return false; }
    return true;
  }
  // check a field when you leave it (only once something's been typed), and clear the error as you fix it
  Object.keys(RULES).forEach(id => {
    el(id).addEventListener('blur', () => { if (val(id)) checkField(id); });
    el(id).addEventListener('input', () => { if (el(id).closest('.field').classList.contains('invalid')) checkField(id); });
  });

  function collect() {
    const types = [...form.querySelectorAll('input[name="type"]:checked')].map(i => i.value);
    const contact = val('cf-email');
    return {
      name: val('cf-name'),
      email: isEmail(contact) ? contact : '',
      phone: isEmail(contact) ? '' : contact,
      type: types.join(', '),
      budget: form.querySelector('input[name="budget"]:checked')?.value || '',
      date: val('cf-date'),
      location: val('cf-location'),
      message: val('cf-message'),
    };
  }

  /* drafts: keep what they've typed if they wander off and come back */
  function saveDraft() {
    try {
      const d = collect();
      d.contact = val('cf-email');
      localStorage.setItem(DRAFT, JSON.stringify(d));
    } catch (e) {}
  }
  function restoreDraft() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (e) {}
    if (!d) return;
    if (d.name) el('cf-name').value = d.name;
    if (d.contact) el('cf-email').value = d.contact;
    if (d.message) el('cf-message').value = d.message;
    if (d.date) el('cf-date').value = d.date;
    if (d.location) el('cf-location').value = d.location;
    (d.type || '').split(', ').forEach(t => { const i = form.querySelector(`input[name="type"][value="${CSS.escape(t)}"]`); if (i) i.checked = true; });
    if (d.budget) { const i = form.querySelector(`input[name="budget"][value="${CSS.escape(d.budget)}"]`); if (i) i.checked = true; }
    if (d.budget || d.date || d.location) el('cf-more').open = true;
  }
  const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch (e) {} };
  restoreDraft();
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  /* "Want one like this?" from the video player, on this page or arriving from work.html */
  function prefill({ title, kind }) {
    if (kind) {
      const i = form.querySelector(`input[name="type"][value="${CSS.escape(kind)}"]`);
      if (i) i.checked = true;
    }
    const msg = el('cf-message');
    if (title && !msg.value.includes(title)) msg.value = `I'd love something like "${title}". ` + msg.value;
    saveDraft();
  }
  addEventListener('contact:prefill', e => prefill(e.detail || {}));
  const q = new URLSearchParams(location.search);
  if (q.get('like')) prefill({ title: q.get('like'), kind: q.get('kind') });

  function showDone(name) {
    el('cf-done-name').textContent = name.split(' ')[0] || 'thanks';
    say(DEFAULT_STATUS);
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
  }
  el('cf-again').addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    form.reset();
    send.classList.remove('sent');
    label.textContent = 'Send it';
    say(DEFAULT_STATUS);
    el('cf-name').focus();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    const d = collect();

    // Formspree fields: `email` becomes the reply-to (only sent when it's a real address), `_subject`
    // is the notification's subject line, and `_gotcha` is a hidden honeypot that only bots fill in.
    const payload = {
      _subject: `New project${d.type ? `: ${d.type}` : ''} from ${d.name}`,
      _gotcha: form.querySelector('[name="_gotcha"]')?.value || '',
      name: d.name,
      ...(d.email ? { email: d.email } : {}),
      phone: d.phone,
      project: d.type,
      message: d.message,
      budget: d.budget,
      date: d.date,
      location: d.location,
      page: location.pathname,
    };
    Object.keys(payload).forEach(k => { if (payload[k] === '' && k !== '_gotcha') delete payload[k]; });

    send.disabled = true;
    label.textContent = 'Sending…';
    say('Sending…');
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = '';
        try { msg = ((await res.json()).errors || []).map(x => x.message).join(' '); } catch (_) {}
        throw new Error(msg || String(res.status));
      }
      clearDraft();
      showDone(d.name);
    } catch (err) {
      label.textContent = 'Send it';
      const detail = err && err.message && !/^\d+$/.test(err.message) && err.message !== 'Failed to fetch' ? ` (${err.message})` : '';
      say(`That didn't go through${detail}. Check your connection and try again in a moment.`, true);
    } finally {
      send.disabled = false;
    }
  });
})();
