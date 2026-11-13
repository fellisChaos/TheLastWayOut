// The ride out of town: shops -> fields -> forest edge. Evening light fading.
import * as THREE from 'three'
import { Level, pole, wires, teaStall, signboard, buildHouse, streetLight, truck, bush, bx, cyl } from '../world/build.js'
import { scatterForest, makePalm } from '../world/nature.js'
import { smoothPts, polyLen, projDist } from '../world/common.js'
import { tex } from '../world/textures.js'
import { R } from '../core/util.js'

export function build(G, opts = {}) {
  const L = new Level(G, 'road')
  G.env.set('evening', true)
  const raw = [[0, -20], [0, 60], [6, 140], [-8, 230], [-10, 320], [4, 410], [18, 500], [10, 590], [-4, 680], [-6, 760]]
  const pts = smoothPts(raw, 8)
  const len = polyLen(pts)
  L.roadLen = len; L.pts = pts
  L.ground(700, 1100, 'grass', 7, 0, 380, 0xe0e8d0)
  L.ribbon(pts, 3.1, 'road', 6, 0.012)
  L.ribbon(pts.map(p => ({ x: p.x - 0.02, z: p.z })), 4.1, 'mud', 4, 0.006)
  L.rideCorr = { pts, hw: 3.7 }
  L.walk.corridor(pts, 3.7, 'road')
  L.projDist = (x, z) => projDist(pts, x, z)
  L.surface = () => 'road'
  const side = (d, off) => { // point offset from road at distance d
    let acc = 0
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); if (acc + l >= d) { const k = (d - acc) / l, dx = pts[i].x - pts[i - 1].x, dz = pts[i].z - pts[i - 1].z, ll = Math.hypot(dx, dz); const x = pts[i - 1].x + dx * k, z = pts[i - 1].z + dz * k; return { x: x + (-dz / ll) * off, z: z + (dx / ll) * off, yaw: Math.atan2(dx, dz) } } acc += l }
    return { x: 0, z: 0, yaw: 0 }
  }
  // forest density grows with distance
  const segs = [[-30, 150, 0.0012], [150, 300, 0.004], [300, 450, 0.012], [450, 600, 0.022], [600, 800, 0.034]]
  for (const [a, b, d] of segs) {
    const A = side(Math.max(0, a), 0), B = side(Math.min(len, b), 0)
    L.add(scatterForest(G, { bounds: [Math.min(A.x, B.x) - 70, Math.min(A.z, B.z) - 5, Math.max(A.x, B.x) + 70, Math.max(A.z, B.z) + 5], trails: [{ pts, hw: 5.2 }], density: d, seed: Math.floor(a) + 5 }))
  }
  // town edge: a few houses + shops, thinning out
  const house = (d, off, rot, col, roof = 'tile') => { const s = side(d, off); buildHouse(L, { x: s.x, z: s.z, w: 6 + R.next() * 3, d: 5, h: 3, rot: s.yaw + (off < 0 ? Math.PI / 2 : -Math.PI / 2), col, roof, interior: false, wall: R.next() < 0.3 ? 'brick' : 'plaster', windows: [{ side: 's', x: 0, y: 1.3, w: 1, h: 1, lit: R.next() < 0.5 }] }) }
  house(14, 11, 0, '#e3c9a0'); house(30, -10, 0, '#c8d6c0', 'flat'); house(52, 12, 0, '#d9b79a'); house(80, -11, 0, '#d4c8e0', 'flat'); house(105, 12, 0, '#e8d6a8'); house(150, -12, 0, '#cfc2a0'); house(190, 13, 0, '#b8c8b0', 'thatch')
  const stall = teaStall(); const s1 = side(125, 6.5); stall.position.set(s1.x, 0, s1.z); stall.rotation.y = s1.yaw + Math.PI / 2; L.add(stall)
  const ck = new THREE.Group(); // roadside shops row
  const sb = signboard('जंगल क्षेत्र · वन विभाग\nTiger / Leopard Zone', '#1f5a34', '#f2f0e0', 3, 1.2); const s2 = side(380, 5.2); sb.position.set(s2.x, 0, s2.z); sb.rotation.y = s2.yaw + Math.PI + 0.1; L.add(sb)
  const sb2 = signboard('Next Petrol Pump 42 km', '#1c3a6a', '#f4f0e0', 2.6, 1.0); const s3 = side(250, -5.2); sb2.position.set(s3.x, 0, s3.z); sb2.rotation.y = s3.yaw + 0.05; L.add(sb2)
  for (let d = 10; d < 330; d += 24) { const s = side(d, -5.6); pole(L, s.x, s.z, 8) }
  for (let d = 10; d < 306; d += 24) { const a = side(d, -5.6), b = side(d + 24, -5.6); wires(L, { x: a.x, y: 7.6, z: a.z }, { x: b.x, y: 7.6, z: b.z }, 0.8) }
  for (let d = 20; d < 170; d += 60) { const s = side(d, 6.2); streetLight(L, s.x, s.z, false) }
  for (let i = 0; i < 9; i++) { const s = side(R.range(150, 330), R.range(8, 20) * (R.next() < 0.5 ? 1 : -1)); const p = makePalm(R.range(7, 10)); p.position.set(s.x, 0, s.z); L.add(p) }
  // the scooter
  const st = side(0, 0)
  G.addScooter(L, st.x, st.z, 0)
  L.spawn = { x: 0, z: -2, yaw: 0 }
  // dusk drift, a truck passing once
  let passed = false
  L.updaters.push(() => {
    const sc = G.scooter, pr = projDist(pts, sc.chassis.position.x, sc.chassis.position.z) / len
    G.env.set(pr > 0.8 ? 'dusk' : 'evening')
    if (!passed && pr > 0.16) { passed = true; const a = side(120, -1.4), b = side(10, -1.4); audio_pass(G, a, b) }
  })
  L.ambient = (S) => { const pr = projDist(pts, G.player.pos.x, G.player.pos.z) / len; S.traffic = Math.max(0, 0.5 - pr * 1.2); S.birds = pr < 0.7 ? 0.6 : 0.2; S.insects = pr > 0.55 ? 0.8 : 0.1 }
  return L
}
function audio_pass(G, a, b) { G.audio.passBy({ x: a.x, y: 1, z: a.z }, { x: b.x, y: 1, z: b.z }, 5, 'truck') }
