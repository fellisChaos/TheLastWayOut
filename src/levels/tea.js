// Ending B: the road in early morning with a tea stall.
import * as THREE from 'three'
import { Level, teaStall, table, stool, pole, wires, signboard, bx } from '../world/build.js'
import { scatterForest } from '../world/nature.js'
import { makeSteelGlass } from '../world/people.js'
import { tex } from '../world/textures.js'
import { smoothPts } from '../world/common.js'

export function build(G, opts = {}) {
  const L = new Level(G, 'tea')
  G.env.set('dawn', true)
  const pts = smoothPts([[0, -20], [0, 60], [4, 150], [0, 230], [-6, 300]], 8)
  L.ground(400, 500, 'grass', 7, 0, 140, 0xdde4cc)
  L.ribbon(pts, 3.2, 'road', 6, 0.012); L.ribbon(pts, 4.2, 'mud', 4, 0.006)
  L.walk.corridor(pts, 3.8, 'road'); L.roadPts = pts
  L.add(scatterForest(G, { bounds: [-90, -30, 90, 330], trails: [{ pts, hw: 6 }], density: 0.012, seed: 15 }))
  for (let z = 0; z < 280; z += 26) pole(L, -5.6, z, 8)
  for (let z = 0; z < 260; z += 26) wires(L, { x: -5.6, y: 7.6, z }, { x: -5.6, y: 7.6, z: z + 26 }, 0.8)
  const st = teaStall(); st.position.set(6.3, 0, 180); st.rotation.y = -Math.PI / 2; L.add(st); L.walk.box(5.0, 178.2, 7.6, 181.8); L.refs.stall = new THREE.Vector3(6.3, 1, 180)
  const bench = table(1.6, 0.4, 0.45); bench.position.set(4.2, 0, 176.6); L.add(bench)
  const s1 = stool(); s1.position.set(3.2, 0, 178.8); L.add(s1); const s2 = stool(); s2.position.set(3.2, 0, 180.2); L.add(s2)
  L.refs.sit1 = new THREE.Vector3(3.2, 0, 178.8); L.refs.sit2 = new THREE.Vector3(3.2, 0, 180.2)
  L.refs.chaiPos = new THREE.Vector3(5.6, 1.1, 180.3)
  L.refs.tableTop = new THREE.Vector3(4.2, 0.5, 176.6)
  L.spawn = { x: 0, z: -14, yaw: 0 }
  L.surface = () => 'road'
  L.ambient = (S) => { S.birds = 0.8; S.insects = 0.1; S.traffic = 0.15 }
  return L
}
