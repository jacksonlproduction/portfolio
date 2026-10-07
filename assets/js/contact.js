// Contact: copy-email button and the project form.
//
// To receive form messages without an email app opening, create a free form endpoint
// (for example at formspree.io) and paste its URL below. Until then, "Send it" opens the
// visitor's email app with everything they filled in, addressed to CONTACT_EMAIL.
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = 'hello@jacksonluria.com'; // placeholder: change to your real address (also in index.html)

(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ───────── Copy email ───────── */
  const copyBtn = document.getElementById('copy-email');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      copyBtn.textContent = 'Copied';
    } catch {
      // Clipboard blocked: select the address so it can be copied by hand.
      const a = document.getElementById('contact-email');
      const r = document.createRange(); r.selectNodeContents(a);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      copyBtn.textContent = 'Selected';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
  });

  /* ───────── Form ───────── */
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('cf-status');
  const send = document.getElementById('cf-send');
  const label = send.querySelector('.send-label');

  const val = id => document.getElementById(id).value.trim();
  const say = (msg, isError) => {
    status.textContent = msg;
    status.classList.toggle('error', !!isError);
  };

  function validate() {
    let firstBad = null;
    const check = (id, ok) => {
      const input = document.getElementById(id);
      input.closest('.field').classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !firstBad) firstBad = input;
    };
    check('cf-name', val('cf-name').length > 0);
    check('cf-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('cf-email')));
    check('cf-message', val('cf-message').length > 0);
    if (firstBad) {
      const what = firstBad.id === 'cf-email' ? 'a valid email' : firstBad.id === 'cf-name' ? 'your name' : 'a few words about the project';
      say(`Add ${what} and try again.`, true);
      firstBad.focus();
      return false;
    }
    return true;
  }

  form.addEventListener('input', e => {
    const f = e.target.closest('.field');
    if (f && f.classList.contains('invalid')) { f.classList.remove('invalid'); say(''); }
  });

  function collect() {
    const types = [...form.querySelectorAll('input[name="type"]:checked')].map(i => i.value);
    const budget = form.querySelector('input[name="budget"]:checked')?.value || '';
    return {
      name: val('cf-name'),
      email: val('cf-email'),
      type: types.join(', '),
      budget,
      date: val('cf-date'),
      location: val('cf-location'),
      message: val('cf-message'),
    };
  }

  function mailtoFallback(d) {
    const lines = [
      d.message, '',
      `Name: ${d.name}`, `Email: ${d.email}`,
      d.type && `Project: ${d.type}`, d.budget && `Budget: ${d.budget}`,
      d.date && `Date: ${d.date}`, d.location && `Where: ${d.location}`,
    ].filter(x => x !== false && x !== '');
    const subject = `New project${d.type ? `: ${d.type}` : ''} from ${d.name}`;
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    const d = collect();

    if (!FORM_ENDPOINT) {
      mailtoFallback(d);
      say('Your email app should open with everything filled in. If it didn\'t, email ' + CONTACT_EMAIL + '.');
      return;
    }

    send.disabled = true;
    label.textContent = 'Sending…';
    say('');
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(d),
      });
      if (!res.ok) throw new Error(String(res.status));
      send.classList.add('sent');
      label.textContent = 'Sent';
      say(`Thanks, ${d.name.split(' ')[0]}. I'll get back to you within a day.`);
      form.reset();
    } catch {
      label.textContent = 'Send it';
      say(`That didn't go through. Try again, or email ${CONTACT_EMAIL}.`, true);
    } finally {
      send.disabled = false;
    }
  });
})();
