// Story helper layer: dialogue shortcuts, level loading, timing utilities
import * as THREE from 'three'
import { G } from '../game.js'
import { ui } from '../core/ui.js'
import { audio } from '../core/audio.js'
import { unlock } from '../reality.js'

export { G, ui, audio, THREE }
export const wait = (s) => G.wait(s)
export const N = (hi, en, o) => ui.say('Nishan', hi, en, o)
export const T = (hi, en, o) => ui.say('Nishant', hi, en, o)       // Nishant (companion)
export const U = (hi, en, o) => ui.say('Uncle', hi, en, o)
export const say = (who, hi, en, o) => ui.say(who, hi, en, o)
// reality unlocks are silent: shown in the report after the story
export const reveal = (...ids) => ids.forEach(id => unlock(id))
export const P = () => G.player

export async function load(name, opts = {}, comp = { x: 0, z: 0, outfit: 'nishant' }) {
  ui.show('hud', true)
  const L = await G.loadLevel(name, opts)
  if (comp !== false) {
    const sp = L.spawn, f = { x: Math.sin(sp.yaw), z: Math.cos(sp.yaw) }
    G.spawnCompanion(sp.x - f.z * -1.1 + (comp.dx || 0), sp.z - f.x * 1.1 + (comp.dz || 0), sp.yaw, comp.outfit || 'nishant')
  }
  G.torchOn = false; G.fearT = 0; G.tiredT = opts.tired ?? G.tiredT
  G.player.canMove = true; G.player.canLook = true; G.player.mode = 'walk'; G.player.push = false
  G.camOverride = null; G.clearInteracts(); G.lookLimit = null; G.noRun = false
  return L
}
export async function startScene(fadeSec = 1.6) { G.input.enabled = true; G.input.lock(); await ui.fade(0, fadeSec) }
export async function endScene(fadeSec = 1.4) { await ui.fade(1, fadeSec) }

// wait for the player to press E on something at pos
export function useAt(pos, label, o) { return G.interact(pos, label, o) }
// wait until the player is within r of (x,z)
export const reach = (x, z, r = 2.2) => G.until(() => G.distToPlayer(x, z) < r)
export const reachZone = (zn) => G.until(() => G.distToPlayer(zn.x, zn.z) < zn.r)
// wait until progress along polyline >= d
export function alongTrail(L, pts, d, proj) { return G.until(() => proj(pts, G.player.pos.x, G.player.pos.z) >= d) }

// glance helpers
export function lookAtMe(pos, cos = 0.9) { return G.playerLookingAt3(pos, cos) }
export const heard = async (hi, en, pos, who = 'Awaaz') => { await ui.say(who, hi, en, { pos }) }

// make companion stand still and look at something
export function compHold(x, z) { const c = G.comp; if (!c) return; c.mode = 'hold'; c.holdPos = { x, z } }
export function compFollow() { const c = G.comp; if (!c) return; c.mode = 'follow'; c.holdPos = null }
export function setTime(h, rate = 0, frozen = false, show = true) { G.setClock(h, frozen, show); G.clockRate = rate }

// fear / tiredness presets
export const fear = (v) => { G.fearT = v }
export const tired = (v) => { G.tiredT = v }

// random point around player at radius r (behind / sides)
export function around(r, ang0 = 0, spread = Math.PI * 2) {
  const p = G.player.pos, a = G.player.yaw + ang0 + (Math.random() - 0.5) * spread
  return { x: p.x + Math.sin(a) * r, y: 1.2, z: p.z + Math.cos(a) * r }
}
// camera shake relaxed by setting
export const shake = (a) => G.camShake(a)
export const caption = (t, d = 2.4) => ui.caption(t, d)
