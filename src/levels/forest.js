// Chapter 2: forest outing. A stem trail leads to a ring trail; the clearing with the split tree sits on the ring.
import * as THREE from 'three'
import { forestLevel, clearing, polyLen, nightTick } from '../world/common.js'
import { makeSplitTree, makeRock, makeLog, makePalm } from '../world/nature.js'
import { can, bush, cyl } from '../world/build.js'
import { Level } from '../world/build.js'
import { R } from '../core/util.js'

export function build(G, opts = {}) {
  G.env.set('evening', true)
  const cx = 0, cz = 92, rad = 28
  const ring = []
  for (let i = 0; i <= 18; i++) { const a = Math.PI + (i / 18) * Math.PI * 2; ring.push([cx + Math.sin(a) * rad * 1.0, cz - Math.cos(a) * rad * 1.0]) }
  // ring starts at the south point J (0,64) and runs clockwise; A (clearing) is the north point (0,120)
  const stem = [[0, -14], [1, 14], [-2, 40], [0, 64]]
  const tb = [[0, 128], [-3, 150], [-9, 172], [-8, 188]]
  const L = forestLevel(G, { name: 'forest', trails: [{ pts: stem, hw: 2.0, name: 'entry' }, { pts: ring, hw: 1.8, name: 'ring' }, { pts: tb, hw: 1.7, name: 'tb' }], bounds: [-120, -30, 120, 230], density: 0.024, seed: 11, groundSize: [420, 420, 0, 95], avoid: [{ x: 0, z: 120, r: 11 }, { x: -8, z: 192, r: 8 }, { x: 0, z: -8, r: 5 }] })
  const T = (n) => L.trails.find(t => t.name === n)
  L.ringPts = T('ring').pts; L.stemPts = T('entry').pts; L.tbPts = T('tb').pts
  // clearing A with split tree, log seat, rock and the can we leave behind
  clearing(L, 0, 120, 10, 'clearA', 'mud', 5)
  const st = makeSplitTree(); st.position.set(4.5, 0, 123); st.rotation.y = 0.6; L.add(st); L.walk.circle(4.5, 123, 0.8); L.splitTree = st
  const lg = makeLog(2.6, 0.22); lg.position.set(-3.6, 0.22, 118); lg.rotation.y = 0.5; L.add(lg)
  const rk = makeRock(0.7); rk.position.set(-2.2, 0.2, 121.5); L.add(rk); L.walk.circle(-2.2, 121.5, 0.6)
  const cn = can(); cn.position.set(-2.1, 0.62, 121.4); L.add(cn); L.refs.can = cn; L.refs.rockPos = new THREE.Vector3(-2.2, 1, 121.5)
  // small clearing C (trail B end) with an identical can & rock: the "mark we remember"
  clearing(L, -8, 192, 6, 'clearC', 'mud', 5)
  const rk2 = makeRock(0.7); rk2.position.set(-6.2, 0.2, 193); L.add(rk2); L.walk.circle(-6.2, 193, 0.6)
  const cn2 = can(); cn2.position.set(-6.1, 0.62, 193); cn2.rotation.z = 1.4; L.add(cn2); L.refs.can2 = cn2
  L.refs.canPos = new THREE.Vector3(-6.1, 0.7, 193)
  // hidden thick bush screen that grows over the stem junction (J) once nobody is near
  const screen = new THREE.Group(); for (let i = 0; i < 7; i++) { const b = bush(1.9); b.position.set(-2.6 + i * 0.9, 0, 64.8 + R.range(-0.4, 0.4)); screen.add(b) } screen.visible = false; L.add(screen)
  let blocked = false
  L.blockStem = () => { if (blocked) return; blocked = true; L.walk.set('entry', false); screen.visible = true; const t = T('entry'); if (t.mesh) t.mesh.visible = false; L.walk.circle(0, 65.3, 2.8) }
  // scooter at road end
  G.addScooter(L, 2.4, -8, 0)
  // roadside
  for (let i = 0; i < 6; i++) { const p = makePalm(R.range(7, 9)); p.position.set(R.range(-14, 14) + (i % 2 ? 14 : -14), 0, R.range(-12, 8)); L.add(p) }
  L.spawn = { x: 0, z: -4, yaw: 0 }
  L.surface = (x, z) => (Math.hypot(x, z - 120) < 10 ? 'dirt' : 'mud')
  L.ambient = (S) => { S.birds = G.env.name === 'evening' ? 0.7 : 0; S.insects = G.env.name === 'evening' ? 0.5 : 1 }
  nightTick(L, G, { owl: G.time > 18.7 ? 1 : 0, dog: 0, jackal: 0, peacock: G.time < 19 ? 1 : 0 })
  return L
}
