// Chapter 3-4: dense bamboo shade in the storm.
import * as THREE from 'three'
import { forestLevel, clearing, nightTick, windSway } from '../world/common.js'
import { makeBambooClump, makeRock, makeLog } from '../world/nature.js'
import { audio } from '../core/audio.js'
import { R } from '../core/util.js'

export function build(G, opts = {}) {
  G.env.set(opts.env || 'storm', true)
  const L = forestLevel(G, { name: 'bamboo', trails: [{ pts: [[0, -14], [1, 14], [0, 36]], hw: 2, name: 'in' }, { pts: [[1, 54], [1, 72], [5, 100], [14, 130]], hw: 1.7, name: 'out' }], bounds: [-90, -30, 90, 150], density: 0.022, seed: 21, groundSize: [300, 300, 0, 50], avoid: [{ x: 0, z: 47, r: 12 }], groundColor: 0xbcc4b4 })
  clearing(L, 0, 47, 8, 'shelter', 'mud', 5)
  L.puddle(-2, 44, 1.1); L.puddle(3, 50, 0.8)
  const pos = [[-7, 41], [-8.5, 50], [-4, 57], [5.5, 57], [9, 49], [8, 40], [-6, 63], [6, 66], [-12, 58], [12, 58]]
  const sw = []
  pos.forEach((p, i) => { const b = makeBambooClump(G, { seed: 30 + i, n: 44, radius: 2.7, h: 10 }); b.position.set(p[0], 0, p[1]); L.add(b); sw.push(b.userData.sway); L.walk.circle(p[0], p[1], 2.5) })
  windSway(L, G, sw)
  const log = makeLog(2.4, 0.2); log.position.set(-3, 0.2, 47); log.rotation.y = 0.9; L.add(log)
  const rk = makeRock(0.8); rk.position.set(3.4, 0.22, 46); L.add(rk); L.walk.circle(3.4, 46, 0.7)
  L.refs.seat = new THREE.Vector3(-3, 0.5, 47); L.refs.rock = new THREE.Vector3(3.4, 0.6, 46)
  L.bambooNear = (x, z) => { let m = 99; for (const p of pos) m = Math.min(m, Math.hypot(x - p[0], z - p[1])); return m }
  L.isIndoors = (x, z) => (Math.hypot(x, z - 47) < 6 ? 0.9 : 0)
  L.spawn = { x: 0, z: -8, yaw: 0 }
  L.surface = () => 'mud'
  let dripT = 0
  L.tickAudio = (dt) => { if (!audio.ctx) return; dripT -= dt; if (dripT < 0 && Math.hypot(G.player.pos.x, G.player.pos.z - 47) < 7) { dripT = R.range(0.25, 1.1); audio.drip(0.9) } }
  return L
}
