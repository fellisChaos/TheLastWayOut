import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/800.css'
import '@fontsource/noto-sans-devanagari/devanagari-400.css'
import '@fontsource/noto-sans-devanagari/devanagari-700.css'
import './style.css'
import { G } from './game.js'
import { audio } from './core/audio.js'
import { input } from './core/input.js'
import { ui } from './core/ui.js'
import { REALITY, getUnlocked } from './reality.js'
import { CHAPTERS, play, stopStory } from './story/story.js'
import { nav } from './core/nav.js'

const $ = (id) => document.getElementById(id)
const SKEY = 'tlwo_settings_v1'
const defaults = { master: 0.8, voice: 1, amb: 0.8, sfx: 1, sens: 1, subs: 'both', caps: true, gfx: 'med', shake: false, flash: false, tts: false, vlang: 'hi', nav: 'full' }
let S = { ...defaults, ...(() => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}') } catch (e) { return {} } })() }
let inGame = false, screenStack = [], pausedNow = false

// ---------- screens ----------
const SCREENS = ['menu', 'chapters', 'settings', 'controls', 'pause', 'report', 'endcard', 'map']
function showScreen(id) { SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id)); screenStack.push(id) }
function hideScreens() { SCREENS.forEach(s => $(s).classList.add('hidden')); screenStack = [] }
let backTo = 'menu'

// ---------- settings ----------
function applySettings() {
  audio.vol.master = +S.master; audio.vol.voice = +S.voice; audio.vol.amb = +S.amb; audio.vol.sfx = +S.sfx; audio.applyVolumes()
  input.sens = +S.sens; ui.subMode = S.subs; ui.caps = !!S.caps; ui.tts = false; ui.voiceLang = S.vlang
  nav.setMode(S.nav);
  G.cfg.reduceShake = !!S.shake; G.cfg.reduceFlash = !!S.flash; ui.reduceFlash = !!S.flash
  if (G.renderer) G.setGfx(S.gfx); else G.cfg.gfx = S.gfx
  localStorage.setItem(SKEY, JSON.stringify(S))
}
function bindSettings() {
  const map = { 's-master': 'master', 's-voice': 'voice', 's-amb': 'amb', 's-sfx': 'sfx', 's-sens': 'sens', 's-subs': 'subs', 's-caps': 'caps', 's-gfx': 'gfx', 's-shake': 'shake', 's-flash': 'flash', 's-vlang': 'vlang', 's-nav': 'nav' }
  for (const [id, k] of Object.entries(map)) {
    const el = $(id); if (el.type === 'checkbox') el.checked = !!S[k]; else el.value = S[k]
    el.addEventListener('input', () => { S[k] = el.type === 'checkbox' ? el.checked : (el.tagName === 'SELECT' ? el.value : +el.value); applySettings() })
  }
}

// ---------- reality report ----------
function renderReport(head, onlyUnlocked = false) {
  const un = getUnlocked(), box = $('report-cards'); box.innerHTML = ''
  const typeName = { sci: 'SCIENCE · विज्ञान', myth: 'MYTH vs FACT · मिथक', unk: 'UNANSWERED · अनसुलझा', tip: 'REAL-LIFE TIP · सावधानी' }
  $('report-head').innerHTML = head || `<h2>ASLI SACH · THE REALITY REPORT</h2><p>Raat ki har awaaz, har saaya — jitna ho sake, uska asli kaaran. ${un.length} / ${REALITY.length} unlocked. Jo cheezein abhi bhi bina jawab ki hain, unhe hum jawab banakar nahi dikhate.</p>`
  for (const r of REALITY) {
    const open = un.includes(r.id)
    if (onlyUnlocked && !open) continue
    const c = document.createElement('div'); c.className = 'card ' + r.type + (open ? '' : ' locked')
    c.innerHTML = open
      ? `<div class="tag">${typeName[r.type]}</div><h4>${r.title}</h4><div class="saw">Aapne dekha: ${r.saw}</div><p>${r.hi}</p><p class="en">${r.en}</p>`
      : `<div class="tag">${typeName[r.type]}</div><h4>???</h4><div class="saw">Abhi tak nahi mila.</div>`
    box.appendChild(c)
  }
  const n = $('m-log-n'); if (n) n.textContent = `(${un.length}/${REALITY.length})`
}

// ---------- pause ----------
function pauseGame() {
  if (!inGame || pausedNow || mapOpen) return
  pausedNow = true; G.paused = true; input.enabled = false; input.unlock(); if (audio.ctx) audio.ctx.suspend()
  backTo = 'pause'; showScreen('pause')
}
function resumeGame() {
  if (!pausedNow) return
  pausedNow = false; hideScreens(); G.paused = false; input.enabled = true; if (audio.ctx) audio.ctx.resume(); input.lock()
}
addEventListener('keydown', e => { if (e.code === 'Escape' && pausedNow && !$('settings').classList.contains('hidden') === false && !$('controls').classList.contains('hidden') === false) resumeGame() })

// ---------- map ----------
let mapOpen = false
function openMap() {
  if (!inGame || pausedNow || mapOpen || !G.level || input.locked === undefined) return
  mapOpen = true; pausedNow = true; G.paused = true; input.enabled = false; input.unlock(); if (audio.ctx) audio.ctx.suspend()
  document.body.classList.add('map-open'); backTo = 'pause'; showScreen('map'); $('map-title').textContent = 'Naksha · ' + nav.title()
  nav.fullK = 1; drawMap()
}
function drawMap() { nav.drawFull($('map-c')); $('map-obj').innerHTML = nav.fullInfo() }
function closeMap() {
  if (!mapOpen) return
  mapOpen = false; document.body.classList.remove('map-open'); pausedNow = false; hideScreens(); G.paused = false; input.enabled = true; if (audio.ctx) audio.ctx.resume(); input.lock()
}
addEventListener('keydown', e => {
  if (e.repeat) return
  if (e.code === 'KeyM') { if (mapOpen) closeMap(); else openMap() }
  else if (e.code === 'Escape' && mapOpen) { e.stopImmediatePropagation(); closeMap() }
  else if (mapOpen && (e.code === 'Equal' || e.code === 'NumpadAdd')) { nav.fullK = Math.min(8, nav.fullK * 1.35); drawMap() }
  else if (mapOpen && (e.code === 'Minus' || e.code === 'NumpadSubtract')) { nav.fullK = Math.max(1, nav.fullK / 1.35); drawMap() }
}, true)
window.__openMap = openMap

// ---------- game start ----------
async function startGame(chIdx = 0) {
  audio.init(); applySettings()
  hideScreens(); inGame = true; pausedNow = false; G.paused = false
  ui.fadeInstant(1)
  input.enabled = false
  if (!G.running) G.start()
  try {
    const res = await play(chIdx, { onEnd: showEnd })
  } catch (e) { if (e !== 'abort') console.error(e) }
}
function toMenu() {
  mapOpen = false; document.body.classList.remove('map-open'); stopStory(); inGame = false; pausedNow = false; G.paused = false; input.enabled = false; input.unlock()
  ui.show('hud', false); ui.fadeInstant(1); if (audio.ctx) { audio.ctx.resume(); audio.st.engine = 0 }
  renderReport(null); backTo = 'menu'; showScreen('menu'); $('m-quit').classList.toggle('hidden', !window.electronAPI)
}
function showEnd(title, sub) {
  inGame = false; input.enabled = false; input.unlock()
  $('end-title').textContent = title; $('end-sub').textContent = sub; ui.fadeInstant(1); showScreen('endcard')
}

// ---------- wiring ----------
function wire() {
  $('m-start').onclick = () => startGame(0)
  $('m-chapters').onclick = () => { const L = $('chapter-list'); L.innerHTML = ''; CHAPTERS.forEach((c, i) => { const b = document.createElement('button'); b.textContent = `${i + 1}.  ${c.title}`; b.onclick = () => startGame(i); L.appendChild(b) }); showScreen('chapters') }
  $('m-log').onclick = () => { renderReport(null); backTo = 'menu'; showScreen('report') }
  $('m-settings').onclick = () => { backTo = 'menu'; showScreen('settings') }
  $('m-controls').onclick = () => { backTo = 'menu'; showScreen('controls') }
  $('m-quit').onclick = () => window.electronAPI && window.electronAPI.quit()
  document.querySelectorAll('.back').forEach(b => b.onclick = () => showScreen(backTo))
  $('p-resume').onclick = resumeGame
  $('map-close').onclick = closeMap
  $('map-zi').onclick = () => { nav.fullK = Math.min(8, nav.fullK * 1.35); drawMap() }
  $('map-zo').onclick = () => { nav.fullK = Math.max(1, nav.fullK / 1.35); drawMap() }
  $('map-c').addEventListener('wheel', e => { e.preventDefault(); nav.fullK = e.deltaY < 0 ? Math.min(8, nav.fullK * 1.2) : Math.max(1, nav.fullK / 1.2); drawMap() }, { passive: false })
  const tb = (id, fn) => { const b = $(id); if (b) b.addEventListener('touchstart', e => { fn(); e.preventDefault() }, { passive: false }) }
  tb('b-map', () => (mapOpen ? closeMap() : openMap())); tb('b-help', () => nav.help())
  $('p-settings').onclick = () => { backTo = 'pause'; showScreen('settings') }
  $('p-controls').onclick = () => { backTo = 'pause'; showScreen('controls') }
  $('p-menu').onclick = toMenu
  $('r-close').onclick = () => { if (backTo === 'end') showScreen('endcard'); else showScreen('menu') }
  $('e-report').onclick = () => { renderReport(null); backTo = 'end'; showScreen('report') }
  $('e-menu').onclick = toMenu
  // first user gesture unlocks audio
  addEventListener('pointerdown', () => audio.init(), { once: true })
  addEventListener('keydown', () => audio.init(), { once: true })
}

// ---------- boot ----------
G.init($('c')); ui.init(); input.init($('c'), { onPause: pauseGame }); bindSettings(); applySettings(); wire()
G.start()
const q = new URLSearchParams(location.search)
renderReport(null)
if (q.has('ch')) { startGame(+q.get('ch') || 0) } else { ui.fadeInstant(1); showScreen('menu'); ui.show('hud', true); $('m-quit').classList.toggle('hidden', !window.electronAPI) }
if (q.has('auto')) { G.auto = true; if (q.get('auto') === 'b') G.autoPick = 1; if (q.has('ts')) G.timeScale = +q.get('ts'); if (q.has('fast')) G.fastSim = +q.get('fast') }
window.__startGame = startGame
