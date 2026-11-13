// Game core: renderer, physics, player, companion, interaction, timing, level switching
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { audio } from './core/audio.js'
import { input } from './core/input.js'
import { ui } from './core/ui.js'
import { Env } from './world/env.js'
import { Actor } from './world/actors.js'
import { makeTorch } from './world/people.js'
import { clamp, damp, lerp, angDiff, fmtClock, R, nearestOnPoly } from './core/util.js'
import { Scooter } from './world/scooter.js'

export const G = {
  cfg: { density: 1, rain: 1, shadows: false, ambBoost: 1, reduceShake: false, reduceFlash: false, engineSign: -1, gfx: 'med' },
  input, ui, audio, THREE, CANNON, running: false, paused: false, stopped: false, runId: 0,
  timers: [], untils: [], interacts: [], lastDt: 0.016, time: 19.7, clockFrozen: false, clockShow: false, shake: 0,
  level: null, levels: {}, actors: [], flags: {}, camOverride: null, forceLook: null
}
audio.setVec3(THREE.Vector3)
ui.G = G

// ---------------- init ----------------
G.init = function (canvas) {
  G.canvas = canvas
  const r = (G.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }))
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace
  G.scene = new THREE.Scene()
  G.camera = new THREE.PerspectiveCamera(70, 1, 0.08, 1200); G.scene.add(G.camera)
  G.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) }); G.world.allowSleep = false
  G.world.broadphase = new CANNON.SAPBroadphase(G.world); G.world.solver.iterations = 12
  G.mat = { ground: new CANNON.Material('ground'), vehicle: new CANNON.Material('vehicle'), prop: new CANNON.Material('prop') }
  G.world.addContactMaterial(new CANNON.ContactMaterial(G.mat.ground, G.mat.vehicle, { friction: 0.4, restitution: 0 }))
  G.world.addContactMaterial(new CANNON.ContactMaterial(G.mat.ground, G.mat.prop, { friction: 0.5, restitution: 0.35 }))
  G.world.addContactMaterial(new CANNON.ContactMaterial(G.mat.prop, G.mat.prop, { friction: 0.3, restitution: 0.2 }))
  G.world.addContactMaterial(new CANNON.ContactMaterial(G.mat.vehicle, G.mat.prop, { friction: 0.3, restitution: 0.1 }))
  const gb = (G.groundBody = new CANNON.Body({ mass: 0, material: G.mat.ground })); gb.addShape(new CANNON.Plane()); gb.quaternion.setFromEuler(-Math.PI / 2, 0, 0); G.world.addBody(gb)
  G.env = new Env(G)
  // torch (player's flashlight)
  const tl = (G.torch = new THREE.SpotLight('#fff3d6', 0, 46, 0.4, 0.55, 1.35)); tl.position.set(0.18, -0.14, 0); G.camera.add(tl)
  G.torchTarget = new THREE.Object3D(); G.torchTarget.position.set(0.0, -0.05, -8); G.camera.add(G.torchTarget); tl.target = G.torchTarget
  G.torchFill = new THREE.PointLight('#ffe9c0', 0, 7, 2); G.torchFill.position.set(0, 0, -0.6); G.camera.add(G.torchFill)
  G.torchOn = false; G.torchPow = 1
  // player
  G.player = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, eyeH: 1.62, crouch: 0, stamina: 1, bobT: 0, stepT: 0, mode: 'walk', canMove: true, canLook: true, speedMul: 1, vel: 0, roll: 0, lookX: 0, push: false, tired: 0, headDip: 0 }
  G.fear = 0; G.fearT = 0; G.tiredT = 0
  addEventListener('resize', G.resize); G.resize()
  G.setGfx(G.cfg.gfx)
}
G.resize = function () { const w = innerWidth, h = innerHeight; G.renderer.setSize(w, h, false); G.camera.aspect = w / h; G.camera.updateProjectionMatrix() }
G.setGfx = function (q) {
  G.cfg.gfx = q
  const pr = { low: 0.6, med: 0.85, high: Math.min(devicePixelRatio, 1.5) }[q]; G.renderer.setPixelRatio(pr)
  G.cfg.density = { low: 0.55, med: 0.8, high: 1 }[q]; G.cfg.rain = { low: 0.4, med: 0.75, high: 1 }[q]
  G.renderer.shadowMap.enabled = false
}

// ---------------- timing ----------------
G.wait = (s) => new Promise((res, rej) => { if (G.stopped) return rej('abort'); G.timers.push({ t: s, res, rej }) })
G.until = (fn, timeout = 0) => new Promise((res, rej) => { if (G.stopped) return rej('abort'); G.untils.push({ fn, res, rej, t: timeout, el: 0 }) })
G.waitSkippable = (s) => new Promise((res, rej) => { if (G.stopped) return rej('abort'); G.timers.push({ t: s, res, rej, skippable: true, el: 0 }) })
G.abort = function () {
  G.stopped = true; G.runId++
  const rej = [...G.timers, ...G.untils]; G.timers = []; G.untils = []
  rej.forEach(x => x.rej('abort')); if (G._choiceRej) G._choiceRej('abort')
  G.interacts.forEach(i => i.rej && i.rej('abort')); G.interacts = []
}
G.beginRun = function () { G.stopped = false }

// ---------------- clock ----------------
G.setClock = function (h, frozen = false, show = true) { G.time = h; G.clockFrozen = frozen; G.clockShow = show; ui.clock(fmtClock(h), frozen, show) }
G.tickClock = function (dt, rate) { if (G.clockFrozen || !rate) return; G.time += dt * rate / 3600; ui.clock(fmtClock(G.time), false, G.clockShow) }

// ---------------- levels ----------------
G.loadLevel = async function (name, opts = {}) {
  if (G.level) { G.level.dispose(); G.level = null }
  G.actors.forEach(a => a.dispose()); G.actors = []; G.comp = null; G.scooter = null
  // purge any leftover rain/torch state
  const mod = await import('./levels/' + name + '.js')
  const L = mod.build(G, opts); G.level = L; G.scene.add(L.group)
  G.interacts = []
  const p = G.player; p.pos.set(L.spawn.x, 0, L.spawn.z); p.yaw = L.spawn.yaw; p.pitch = 0
  G.env.indoors = false; G.env.fogMul = 1
  return L
}
G.addActor = function (outfit, over) { const a = new Actor(G, outfit, over); G.actors.push(a); return a }
G.removeActor = function (a) { const i = G.actors.indexOf(a); if (i >= 0) G.actors.splice(i, 1); a.dispose(); if (G.comp === a) G.comp = null }

// ---------------- companion (Nishant) ----------------
G.spawnCompanion = function (x, z, yaw = 0, outfit = 'nishant') {
  const a = G.addActor(outfit); a.place(x, z, yaw); a.collide = true; G.comp = a
  a.mode = 'follow'; a.alertT = 0; a.idleLookT = 3; a.sideSign = 1; a.holdPos = null; a.catchup = false; a.torchOn = false
  return a
}
function companionUpdate(dt) {
  const c = G.comp; if (!c || c.attach) return
  const p = G.player, pf = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) }, pr = { x: -pf.z, z: pf.x }
  const dxp = p.pos.x - c.pos.x, dzp = p.pos.z - c.pos.z, dp = Math.hypot(dxp, dzp)
  c.alertT = Math.max(0, c.alertT - dt)
  if (c.mode === 'follow') {
    if (c.alertT > 0) { c.path = []; c.look(c.alertPos); c.face(c.alertPos) }
    else {
      const sc = G.scooter && p.push
      const off = sc ? { f: 0.2, r: 1.2 * c.sideSign } : { f: -1.1, r: -1.0 * c.sideSign }
      const tx = p.pos.x + pf.x * off.f + pr.x * off.r, tz = p.pos.z + pf.z * off.f + pr.z * off.r
      const d = Math.hypot(tx - c.pos.x, tz - c.pos.z)
      if (d > 0.7) { const sp = clamp(d * 1.6, 0.6, dp > 7 ? 3.6 : 2.5) * (1 - G.player.tired * 0.25); c.path = [{ x: tx, z: tz }]; c.walkSpeed = sp } else { c.path = []; c.face(Math.atan2(pf.x, pf.z) + 0.0) }
      c.idleLookT -= dt
      if (c.idleLookT <= 0) { c.idleLookT = R.range(2.5, 6); c.glance = R.next() < 0.6 ? { x: c.pos.x + R.range(-6, 6), y: 1.5, z: c.pos.z + R.range(-6, 6) } : null }
      if (dp < 3.5 && G.lookingNow) c.look(G.lookingNow); else if (c.glance && dp < 8) c.look(c.glance); else c.look({ x: p.pos.x + pf.x * 6, y: 1.4, z: p.pos.z + pf.z * 6 })
    }
  } else if (c.mode === 'hold' && c.holdPos) {
    const d = Math.hypot(c.holdPos.x - c.pos.x, c.holdPos.z - c.pos.z)
    if (d > 0.5) { c.path = [{ x: c.holdPos.x, z: c.holdPos.z }]; c.walkSpeed = 1.8 } else { c.path = []; c.face(Math.atan2(dxp, dzp)) }
    c.look(c.alertT > 0 ? c.alertPos : { x: p.pos.x, y: 1.5, z: p.pos.z })
  }
}
G.alertComp = function (pos, dur = 2.2) { const c = G.comp; if (!c) return; c.alertT = dur; c.alertPos = pos.isVector3 ? pos : { x: pos.x, y: pos.y ?? 1.4, z: pos.z } }
G.compSay = (hi, en, o) => ui.say('Nishant', hi, en, o)
G.nishanSay = (hi, en, o) => ui.say('Nishan', hi, en, o)

// ---------------- scooter helpers ----------------
G.addScooter = function (L, x, z, yaw = 0, color = '#27508f') {
  const sc = new Scooter(G, color); sc.place(x, z, yaw); L.group.add(sc.root); L.disposers.push(() => sc.dispose()); G.scooter = sc; L.scooter = sc
  for (let i = 0; i < 40; i++) { G.world.step(1 / 60); sc.sync(0.016) }
  sc.park(); return sc
}
G.mount = function (sc) {
  const p = G.player; p.mode = 'ride'; G.scooter = sc; sc.parked = false; sc.light(true); audio.st.engine = 1
  if (G.comp) { G.comp.attach = sc.pillion; G.comp.pose('pillion'); G.comp.path = [] }
  ui.show('speedo', true)
}
G.dismount = function (x, z) {
  const p = G.player, sc = G.scooter; p.mode = 'walk'; audio.st.engine = 0; audio.st.rpm = 0; ui.show('speedo', false)
  sc.park(); const f = sc.fwd(); p.pos.set(x ?? sc.chassis.position.x - f.z * 0.9, 0, z ?? sc.chassis.position.z + f.x * 0.9); p.yaw = sc.yaw
  if (G.comp && G.comp.attach) { const c = G.comp; c.attach = null; c.pose('stand'); c.place(sc.chassis.position.x + f.z * 0.9, sc.chassis.position.z - f.x * 0.9, sc.yaw) }
}
G.startPush = function () { const p = G.player, sc = G.scooter; if (!sc) return; p.push = true; p.mode = 'walk'; sc.parked = false; if (G.comp) G.comp.sideSign = 1 }
G.stopPush = function () { const p = G.player, sc = G.scooter; p.push = false; if (sc) sc.park() }

// ---------------- interaction ----------------
G.interact = function (pos, label, o = {}) {
  return new Promise((res, rej) => {
    const it = { pos: pos.isVector3 ? pos : new THREE.Vector3(pos.x, pos.y ?? 1, pos.z), label, r: o.r ?? 2.1, res, rej, once: o.once !== false, cone: o.cone ?? 0.5, key: o.key || 'E', enabled: o.enabled }
    G.interacts.push(it); if (G.stopped) rej('abort')
  })
}
G.addInteract = function (it) { G.interacts.push(it); return it }
G.clearInteracts = function () { G.interacts = [] }

// ---------------- helpers for story ----------------
G.fx = {
  fear(v) { G.fearT = v }, tired(v) { G.tiredT = v }
}
G.setTorch = function (on) { G.torchOn = on; audio.click() }
G.lockMove = (m = true) => { G.player.canMove = !m }
G.teleportPlayer = function (x, z, yaw) { const p = G.player; p.pos.set(x, 0, z); if (yaw !== undefined) p.yaw = yaw }
G.blink = async function (dur = 0.5) { await ui.fade(1, dur * 0.4); await G.wait(dur * 0.2) }
G.unblink = async function (dur = 0.8) { await ui.fade(0, dur) }
G.distToPlayer = (x, z) => Math.hypot(x - G.player.pos.x, z - G.player.pos.z)
G.playerLookingAt = function (pos, cos = 0.8) { const p = G.player, d = new THREE.Vector3(pos.x - p.pos.x, 0, pos.z - p.pos.z).normalize(); const f = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw)); return d.dot(f) > cos }
G.playerLookingAt3 = function (pos, cos = 0.9) { const d = new THREE.Vector3(pos.x, pos.y ?? 1.5, pos.z).sub(G.camera.position).normalize(); const f = new THREE.Vector3(); G.camera.getWorldDirection(f); return d.dot(f) > cos }
G.turnTo = async function (pos, dur = 0.9) {
  const p = G.player, tgt = Math.atan2(pos.x - p.pos.x, pos.z - p.pos.z), ty = Math.atan2((pos.y ?? 1.4) - 1.6, Math.hypot(pos.x - p.pos.x, pos.z - p.pos.z))
  const y0 = p.yaw, d = angDiff(y0, tgt), pi0 = p.pitch; let el = 0
  await G.until(() => { el += G.lastDt; const k = Math.min(1, el / dur), e = k * k * (3 - 2 * k); p.yaw = y0 + d * e; p.pitch = lerp(pi0, ty, e); return k >= 1 })
}
G.camShake = (a = 0.5) => { G.shake = Math.max(G.shake, a * (G.cfg.reduceShake ? 0.25 : 1)) }

// ---------------- main loop ----------------
let last = 0, acc = 0
G.start = function () { G.running = true; last = performance.now(); requestAnimationFrame(loop) }
function loop(now) {
  requestAnimationFrame(loop)
  let dt = Math.min(0.05, (now - last) / 1000); last = now
  if (!G.running) return
  if (G.paused) { G.renderer.render(G.scene, G.camera); return }
  G.lastDt = dt
  G.step(dt)
  G.renderer.render(G.scene, G.camera)
  input.endFrame()
}
G.step = function (dt) {
  const p = G.player, L = G.level
  if (!L) return
  // timers
  for (let i = G.timers.length - 1; i >= 0; i--) { const t = G.timers[i]; t.t -= dt; if (t.skippable) { t.el += dt; if (t.el > 0.5 && (input.hit('Space') || input.hit('Enter'))) t.t = 0 } if (t.t <= 0) { G.timers.splice(i, 1); t.res() } }
  for (let i = G.untils.length - 1; i >= 0; i--) { const u = G.untils[i]; u.el += dt; let ok = false; try { ok = u.fn() } catch (e) { console.error(e) } if (ok || (u.t && u.el >= u.t)) { G.untils.splice(i, 1); u.res(ok) } }
  // player
  playerUpdate(dt)
  // physics
  G.world.step(1 / 60, dt, 4)
  if (G.scooter) { const sc = G.scooter; if (p.mode === 'ride') { const ax = input.axis(); sc.drive(dt, ax.y, ax.x, input.down('Space'), G.rideMax || 11); sc.uprightCheck(dt); rideBound(sc) } else if (p.push) pushScooter(dt); else sc.park(); sc.sync(dt); audio.st.rpm = clamp(Math.abs(sc.speed) / 11, 0, 1); ui.show('speedo', p.mode === 'ride'); if (p.mode === 'ride') document.getElementById('speedo-v').textContent = Math.round(Math.abs(sc.speed) * 3.6) }
  L.update(dt)
  for (const a of G.actors) a.update(dt)
  companionUpdate(dt)
  G.env.update(dt, G.camera.position)
  updateInteract(dt)
  updateCamera(dt)
  updateAudioState(dt)
  G.tickClock(dt, G.clockRate || 0)
  // fear / tired smoothing
  G.fear = damp(G.fear, G.fearT, 1.5, dt); p.tired = damp(p.tired, G.tiredT, 0.5, dt)
  ui.fear(Math.max(0, (G.fear - 0.45) * 1.3))
  audio.st.fear = G.fear > 0.35 ? G.fear : 0
  if (G.onUpdate) G.onUpdate(dt)
}

function rideBound(sc) {
  const L = G.level; if (!L.rideCorr) return
  const c = sc.chassis, n = nearestOnPoly(L.rideCorr.pts, c.position.x, c.position.z)
  if (n.d > L.rideCorr.hw) { const k = L.rideCorr.hw / n.d; const nx = n.x + (c.position.x - n.x) * k, nz = n.z + (c.position.z - n.z) * k; c.position.x = nx; c.position.z = nz; c.velocity.x *= 0.9; c.velocity.z *= 0.9; if (!G._edgeT || performance.now() - G._edgeT > 1500) { G._edgeT = performance.now(); ui.toast('Raaste par hi raho.', 2) } }
}
function playerUpdate(dt) {
  const p = G.player, L = G.level
  // look
  const lk = input.consumeLook(), s = 0.0022 * input.sens * (input.touch ? 1.1 : 1)
  if (p.mode === 'ride') { p.lookOff = clamp((p.lookOff || 0) - lk.x * s, -1.9, 1.9); p.pitch = clamp(p.pitch - lk.y * s, -0.8, 0.5); if (!lk.x) p.lookOff *= Math.exp(-dt * 0.6) }
  else if (p.canLook && !G.paused) { p.yaw -= lk.x * s; p.pitch = clamp(p.pitch - lk.y * s, -1.45, 1.45) }
  if (input.hit('KeyF')) { G.setTorch(!G.torchOn) }
  if (input.hit('KeyP')) G.checkPhone()
  if (p.mode === 'ride' || !p.canMove) { if (p.mode !== 'ride') { p.vel = damp(p.vel, 0, 8, dt); p.crouch = damp(p.crouch, input.down('KeyC') && !G.noCrouch ? 1 : 0, 8, dt) } return }
  const ax = input.axis(), run = input.down('ShiftLeft') || input.down('ShiftRight')
  const tiredF = 1 - p.tired * 0.28
  let sp = 1.55 * tiredF
  const canRun = run && p.stamina > 0.05 && !p.push && ax.y > 0.3 && !G.noRun
  if (canRun) { sp = 3.5 * tiredF; p.stamina = Math.max(0, p.stamina - dt * (0.16 + p.tired * 0.1)) } else p.stamina = Math.min(1, p.stamina + dt * (0.12 - p.tired * 0.06) * (ax.x || ax.y ? 0.5 : 1.4))
  if (p.push) sp = 1.25 * tiredF * (G.mudSlow || 1)
  p.crouch = damp(p.crouch, (input.down('KeyC') || G.forceCrouch) && !p.push && !G.noCrouch ? 1 : 0, 9, dt); sp *= 1 - p.crouch * 0.55
  sp *= p.speedMul
  const f = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) }, r = { x: -f.z, z: f.x }
  let mx = f.x * ax.y + r.x * ax.x, mz = f.z * ax.y + r.z * ax.x
  const mag = Math.hypot(mx, mz); if (mag > 0.001) { mx /= Math.max(1, mag); mz /= Math.max(1, mag) }
  const tv = Math.hypot(mx, mz) * sp; p.vel = damp(p.vel, tv, 10, dt)
  const nx = p.pos.x + mx * sp * dt, nz = p.pos.z + mz * sp * dt
  const np = { x: nx, z: nz }; L.walk.resolve(np, 0.33)
  if (G.scooter && p.push) { /* scooter is a collider while pushing */ }
  else if (G.scooter && !p.push) { const c = G.scooter.chassis.position; const dx = np.x - c.x, dz = np.z - c.z, d = Math.hypot(dx, dz); if (d < 1.05) { const k = 1.05 / (d || 1e-3); np.x = c.x + dx * k; np.z = c.z + dz * k } }
  p.pos.x = np.x; p.pos.z = np.z
  // head bob + footsteps
  const moving = tv > 0.2
  if (moving) { p.bobT += dt * (canRun ? 11.5 : 7.6) * (1 - p.tired * 0.12); p.stepT += dt * (canRun ? 11.5 : 7.6) ; if (p.stepT >= Math.PI) { p.stepT -= Math.PI; if (audio.ctx) audio.footstep(L.surface ? L.surface(p.pos.x, p.pos.z) : 'dirt', canRun ? 1.15 : 0.8 - p.crouch * 0.4) } }
  audio.st.breathRate = canRun ? 0.9 : moving ? 0.38 + p.tired * 0.12 : 0.24 + G.fear * 0.2
  audio.st.breathDepth = canRun ? 1.0 : moving ? 0.35 + p.tired * 0.2 : 0.16 + G.fear * 0.4 + p.tired * 0.2
  if (p.stamina < 0.12 && run) audio.st.breathDepth = 1.2
}

function pushScooter(dt) {
  const p = G.player, sc = G.scooter, c = sc.chassis, f = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) }
  const tgt = { x: p.pos.x + f.x * 1.05, z: p.pos.z + f.z * 1.05 }; G.level.walk.resolve(tgt, 0.4)
  const dx = tgt.x - c.position.x, dz = tgt.z - c.position.z
  c.velocity.x = dx * 9; c.velocity.z = dz * 9
  const dy = angDiff(sc.yaw, p.yaw); c.angularVelocity.y = dy * 6; sc.steer = damp(sc.steer, clamp(dy * 1.5, -0.5, 0.5), 5, dt)
  sc.vehicle.setSteeringValue(-sc.steer, 0); sc.vehicle.setSteeringValue(-sc.steer, 1)
  sc.vehicle.wheelInfos.forEach((w, i) => { sc.vehicle.setBrake(0, i); sc.vehicle.applyEngineForce(0, i) })
  // stay near player
  if (Math.hypot(c.position.x - p.pos.x, c.position.z - p.pos.z) > 3) { c.position.x = tgt.x; c.position.z = tgt.z }
  sc.lean = damp(sc.lean, 0, 3, dt); sc.parked = false
  // wheel roll visual from speed
  const sp = Math.hypot(c.velocity.x, c.velocity.z); sc.vehicle.currentVehicleSpeedKmHour = sp * 3.6 * (dx * f.x + dz * f.z >= 0 ? 1 : -1)
  if (G.level.surface && sp > 0.3 && G.level.surface(p.pos.x, p.pos.z) === 'mud' && Math.random() < dt * 1.5) audio.thud({ x: c.position.x, y: 0.2, z: c.position.z }, 0.12)
}

function updateInteract(dt) {
  const p = G.player; let best = null, bd = 1e9
  if (p.canMove && p.mode !== 'ride') {
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw)
    for (const it of G.interacts) {
      if (it.enabled && !it.enabled()) continue
      const dx = it.pos.x - p.pos.x, dz = it.pos.z - p.pos.z, d = Math.hypot(dx, dz)
      if (d > it.r) continue
      const dot = (dx * fx + dz * fz) / (d || 1); if (dot < it.cone && d > 0.9) continue
      if (d < bd) { bd = d; best = it }
    }
  }
  G.cur = best
  if (best) { ui.prompt(best.label, best.key === 'E' ? 'E' : best.key) } else ui.prompt(p.mode === 'ride' && G.rideHint ? G.rideHint : null, 'E')
  if (best && input.hit('KeyE')) { audio.click(); if (best.once) G.interacts.splice(G.interacts.indexOf(best), 1); if (best.onUse) best.onUse(); if (best.res) best.res() }
}

function updateCamera(dt) {
  const p = G.player, cam = G.camera
  if (G.camOverride) { const o = G.camOverride; cam.position.lerp(o.pos, Math.min(1, dt * 4)); cam.lookAt(o.look); cam.fov = lerp(cam.fov, o.fov || 62, 0.1); cam.updateProjectionMatrix(); return }
  let ex, ey, ez, yaw = p.yaw, pitch = p.pitch, roll = 0
  if (p.mode === 'ride' && G.scooter) {
    const sc = G.scooter, v = new THREE.Vector3(); sc.eye.getWorldPosition(v)
    const q = new THREE.Quaternion(); sc.eye.getWorldQuaternion(q); const e = new THREE.Euler().setFromQuaternion(q, 'YXZ')
    const spd = sc.speed, bump = Math.sin(performance.now() * 0.021) * 0.007 * clamp(Math.abs(spd) / 8, 0, 1)
    p.rideYaw = e.y; p.yaw = e.y + (p.lookOff || 0)
    cam.rotation.order = 'YXZ'; cam.position.set(v.x, v.y + bump, v.z); cam.rotation.set(p.pitch, p.yaw + Math.PI, -sc.lean * 0.5)
    p.pos.set(sc.chassis.position.x, 0, sc.chassis.position.z)
    cam.fov = lerp(cam.fov, 70 + clamp(Math.abs(spd) / 11, 0, 1) * 10, 0.05); cam.updateProjectionMatrix(); return
  }
  const eye = p.eyeH - p.crouch * 0.75 - p.headDip
  const bob = Math.sin(p.bobT) * 0.035 * (1 - p.crouch * 0.4) * (1 + p.tired * 0.4), sway = Math.cos(p.bobT * 0.5) * 0.02
  ex = p.pos.x; ez = p.pos.z; ey = p.pos.y + eye + bob
  const sh = G.shake; G.shake = Math.max(0, G.shake - dt * 1.2)
  cam.position.set(ex + Math.cos(p.yaw) * sway, ey + (Math.random() - 0.5) * sh * 0.05, ez - Math.sin(p.yaw) * sway)
  cam.rotation.order = 'YXZ'; cam.rotation.set(p.pitch + (Math.random() - 0.5) * sh * 0.02, p.yaw + Math.PI + (Math.random() - 0.5) * sh * 0.02, p.roll + Math.sin(p.bobT * 0.5) * 0.004 * (1 + p.tired))
  cam.fov = lerp(cam.fov, 70 - p.crouch * 4 + (input.down('ShiftLeft') && p.vel > 2.5 ? 4 : 0), 0.08); cam.updateProjectionMatrix()
}

function updateAudioState(dt) {
  const p = G.player, S = audio.st, env = G.env, L = G.level
  // torch smooth
  const tl = G.torch; tl.intensity = damp(tl.intensity, G.torchOn ? 70 * G.torchPow : 0, 18, dt); G.torchFill.intensity = tl.intensity * 0.012
  G.torchTarget.position.x = damp(G.torchTarget.position.x, 0, 4, dt)
  // env -> audio
  const indoor = L.isIndoors ? L.isIndoors(p.pos.x, p.pos.z) : 0
  G.env.indoors = indoor > 0.9; S.indoors = indoor
  S.rain = env.rainAmt; S.tin = indoor > 0.5 && env.rainAmt > 0.1 && L.tinRoof ? env.rainAmt : 0
  S.wind = env.windV; S.gust = 0
  const now = env.name, night = ['night', 'storm', 'rain', 'drizzle', 'deep', 'still', 'predawn'].includes(now)
  S.insects = (now === 'dusk' || now === 'night' || now === 'drizzle' || now === 'predawn') && env.rainAmt < 0.5 ? 1 : (now === 'evening' ? 0.4 : 0)
  S.birds = (now === 'day' || now === 'homeDay' || now === 'evening' || now === 'dawn') ? 0.7 : 0
  S.frogs = env.rainAmt > 0.15 || now === 'drizzle' ? 0.5 : 0
  S.bamboo = L.bambooNear ? clamp(1 - L.bambooNear(p.pos.x, p.pos.z) / 25, 0, 1) : 0
  if (L.ambient) L.ambient(S, p)
  if (L.tickAudio) L.tickAudio(dt)
  const f = new THREE.Vector3(); G.camera.getWorldDirection(f)
  audio.update(dt, G.camera.position, f, new THREE.Vector3(0, 1, 0))
  // clock label visible only when allowed
}

G.checkPhone = function () {
  audio.phoneBuzz(); const t = fmtClock(G.time)
  ui.toast(G.hasSignal ? `📶 ${t} — signal OK` : `📵 ${t} — No service · Battery ${Math.max(6, Math.round(78 - (G.time < 12 ? G.time + 24 : G.time) * 0 - (G.time >= 19 ? (G.time - 19) * 6 : 0)))}%`, 3)
}

// pointer events for debug in tests
window.__G = G
