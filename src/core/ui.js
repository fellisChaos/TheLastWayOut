import { audio } from './audio.js'
const $ = (id) => document.getElementById(id)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

class UI {
  constructor() { this.subMode = 'both'; this.caps = true; this.tts = false; this._capT = null; this._toastT = null; this.reduceFlash = false }
  init() { audio.onCaption = (t, d) => this.caption(t, d) }
  show(id, on = true) { $(id).classList.toggle('hidden', !on) }
  async say(who, hi, en, opts = {}) {
    const mode = this.subMode, len = (hi || '').length
    const dur = opts.dur || Math.max(1.6, 0.9 + len * 0.05)
    $('subs-who').textContent = who || ''
    if (mode === 'en') { $('subs-hi').textContent = en || hi; $('subs-en').textContent = '' }
    else { $('subs-hi').textContent = mode === 'off' ? '' : hi; $('subs-en').textContent = mode === 'hi' || mode === 'off' ? '' : (en || '') }
    $('subs').classList.toggle('show', mode !== 'off')
    if (this.tts && window.speechSynthesis) { try { const u = new SpeechSynthesisUtterance(hi); u.lang = 'hi-IN'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch (e) {} }
    try { await this.G.waitSkippable(dur) } finally { if (!opts.keep) $('subs').classList.remove('show') }
    if (opts.gap !== 0) await this.G.wait(opts.gap === undefined ? 0.12 : opts.gap)
  }
  hideSubs() { $('subs').classList.remove('show') }
  caption(t, d = 2) { if (!this.caps) return; const e = $('caption'); e.textContent = t; e.classList.add('show'); clearTimeout(this._capT); this._capT = setTimeout(() => e.classList.remove('show'), d * 1000) }
  toast(t, d = 3.5) { const e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(this._toastT); this._toastT = setTimeout(() => e.classList.remove('show'), d * 1000) }
  prompt(text, key = 'E') {
    const p = $('prompt'); if (!text) { p.classList.remove('show'); return }
    if (p.dataset.t !== text + key) { $('prompt-t').textContent = text; p.querySelector('kbd').textContent = key; p.dataset.t = text + key }
    p.classList.add('show')
  }
  hold(v) { const h = $('holdbar'); h.style.opacity = v > 0 ? 1 : 0; h.firstElementChild.style.width = (v * 100) + '%' }
  clock(txt, frozen = false, show = true) { const c = $('clock'); $('clock-t').textContent = txt; c.classList.toggle('show', show); c.classList.toggle('frozen', frozen) }
  fade(to = 1, sec = 1.2) { const f = $('fade'); f.style.transition = `opacity ${sec}s ease`; f.style.opacity = to; return sleep(sec * 1000 + 30) }
  fadeInstant(v) { const f = $('fade'); f.style.transition = 'none'; f.style.opacity = v; void f.offsetWidth }
  flash(a = 0.8) { if (this.reduceFlash) a *= 0.2; const f = $('flash'); f.style.transition = 'none'; f.style.opacity = a; void f.offsetWidth; f.style.transition = 'opacity .5s ease-out'; f.style.opacity = 0 }
  fear(v) { $('fear').style.opacity = Math.min(1, v) }
  async titleCard(ch, title, time, sec = 3.2) {
    $('tc-chapter').textContent = ch; $('tc-title').textContent = title; $('tc-time').textContent = time || ''
    const t = $('titlecard'); t.style.transition = 'none'; t.style.opacity = 1; this.show('titlecard', true)
    await sleep(sec * 1000)
    t.style.transition = 'opacity 1.2s'; t.style.opacity = 0; await sleep(1200); this.show('titlecard', false)
  }
  choose(q, opts) {
    return new Promise((res, rej) => {
      $('choice-q').textContent = q; const box = $('choice-opts'); box.innerHTML = ''
      let done = false
      const cleanup = () => { removeEventListener('keydown', kd); this.show('choice', false) }
      const pick = (i) => { if (done) return; done = true; cleanup(); this.G.input.enabled = true; this.G.input.lock(); this.G._choiceRej = null; res(i) }
      this.G._choiceRej = (e) => { if (done) return; done = true; cleanup(); rej(e) }
      opts.forEach((o, i) => { const b = document.createElement('button'); b.textContent = `${i + 1}.  ${o}`; b.onclick = () => pick(i); box.appendChild(b) })
      const kd = (e) => { const n = parseInt(e.key); if (n >= 1 && n <= opts.length) pick(n - 1) }
      addEventListener('keydown', kd)
      this.show('choice', true); this.G.input.unlock()
    })
  }
}
export const ui = new UI()
