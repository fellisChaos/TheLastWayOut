// Home + street. opts.night: Ending A homecoming (family is up, tiffin on the table)
import * as THREE from 'three'
import { Level, buildHouse, sofa, table, chair, stool, charpai, tvSet, shelf, matka, brassVessel, chulha, garlandedPhoto, fan, tubeLight, pole, wires, streetLight, autoRickshaw, cow, dogModel, helmetRack, bush, bx, cyl, sph } from '../world/build.js'
import { makeTiffin, makeSteelGlass } from '../world/people.js'
import { tex, withPBR } from '../world/textures.js'
import { R } from '../core/util.js'

export function build(G, opts = {}) {
  const night = !!opts.night
  const L = new Level(G, 'home')
  G.env.set(night ? 'night' : 'homeDay', true)
  L.ground(300, 300, 'grass', 8, 0, 0, night ? 0xb0b8c0 : 0xffffff)
  // road along x at z=14
  const road = L.ground(260, 6.4, 'road', 6, 20, 14); road.position.y = 0.012
  const verge = L.ground(260, 1.4, 'mud', 3, 20, 10.4); verge.position.y = 0.008
  const verge2 = L.ground(260, 1.4, 'mud', 3, 20, 17.6); verge2.position.y = 0.008
  L.walk.corridor([[-30, 14], [90, 14]], 3.1, 'road')
  L.walk.rect(-7, 3.5, 7, 11.2, 'yard')
  L.walk.rect(-9, 10, 12, 18, 'street2')
  L.surface = (x, z) => (house.inside(x, z) ? 'tile' : (z > 11 && z < 17.2 ? 'road' : (z < 3.4 ? 'tile' : 'dirt')))
  // our house
  const house = buildHouse(L, { x: 0, z: 0, w: 9, d: 6, h: 3.1, col: '#e3d3a8', roof: 'flat', floor: 'tile', doorX: 0.6, doorW: 1.2, closedDoor: false, name: 'home',
    windows: [{ side: 's', x: -2.6, y: 1.2, w: 1.1, h: 1.0, lit: true }, { side: 's', x: 3.0, y: 1.2, w: 1.1, h: 1.0, lit: true }, { side: 'n', x: 0, y: 1.2, w: 1.2, h: 1.0, lit: true }] })
  L.house = house
  house.addLight(0, 2.5, 0, night ? '#ffe2b0' : '#ffeccb', night ? 14 : 9, 14)
  house.addLight(-3, 2.5, -1.5, '#ffe2b0', 6, 8)
  tubeLight(L, house.group, 0, 3.05, 0)
  fan(L, house.group, 0, 2.95, 0.5)
  // furniture (house-local x lateral, z depth; +z = door side)
  house.place(sofa(), 2.4, -2.2, 0, 0)
  const tv = tvSet(!night); house.place(tv, -0.4, -2.8, 0.55, 0)
  const tvStand = table(1.2, 0.45, 0.55); house.place(tvStand, -0.4, -2.75, 0, 0)
  house.place(table(1.2, 0.7, 0.45), 2.4, -0.8, 0, 0)
  house.place(shelf(), 4.1, 0.2, 0, -Math.PI / 2)
  house.place(garlandedPhoto(), -4.2, -1.0, 1.55, Math.PI / 2)
  // kitchen corner
  house.place(chulha(), -3.7, -2.5, 0, 0)
  house.place(table(1.3, 0.7, 0.8), -2.9, 0.4, 0, 0)
  const tiffin = makeTiffin(); house.place(tiffin, -2.9, 0.4, 0.8, 0.3)     // left on the table. Never mentioned.
  const gl1 = makeSteelGlass(); house.place(gl1, -2.5, 0.5, 0.8)
  house.place(stool(), -3.7, 1.0, 0, 0.5); house.place(stool(), -2.1, 1.1, 0, 0.2)
  const mt = matka(); house.place(mt, -4.0, 2.4, 0, 0)
  const rack = helmetRack(); house.place(rack, 3.9, 2.6, 0, 0)
  L.refs.helmetPos = house.local(3.9, 1.3, 2.4); L.refs.rack = rack
  L.refs.tiffinPos = house.local(-2.9, 0.9, 0.4)
  L.refs.tiffin = tiffin
  // yard
  const ch = charpai(); ch.position.set(-4.5, 0, 7.6); ch.rotation.y = 0.2; L.add(ch)
  const tul = bush(0.6); tul.position.set(4.6, 0, 5.2); L.add(tul)
  cyl(L.group, 0.28, 0.22, 0.4, withPBR(new THREE.MeshStandardMaterial({ map: tex.mudwall() })), 4.6, 0, 5.2, 10)
  const mt2 = matka(); mt2.position.set(-5.5, 0, 5); L.add(mt2)
  // gate wall
  const wall = withPBR(new THREE.MeshStandardMaterial({ map: tex.plaster('#cdbd96') }))
  bx(L.group, 6.6, 1.2, 0.2, wall, -3.7, 0, 11.6); bx(L.group, 6.6, 1.2, 0.2, wall, 6.1, 0, 11.6); L.solid(-7, 11.5, -0.4, 11.75, 1.2); L.solid(2.8, 11.5, 9.4, 11.75, 1.2)
  bx(L.group, 0.3, 1.5, 0.3, wall, -0.4, 0, 11.6); bx(L.group, 0.3, 1.5, 0.3, wall, 2.8, 0, 11.6)
  // neighbours across the street
  buildHouse(L, { x: -14, z: 25, w: 8, d: 6, h: 3.4, rot: Math.PI, col: '#b8d0c2', roof: 'flat', interior: false, windows: [{ side: 's', x: -2, y: 1.3, w: 1, h: 1, lit: true }, { side: 's', x: 2, y: 1.3, w: 1, h: 1 }] })
  buildHouse(L, { x: 5, z: 26, w: 9, d: 6, h: 3.4, rot: Math.PI, col: '#d8b8a0', roof: 'tile', interior: false, windows: [{ side: 's', x: -2.5, y: 1.3, w: 1, h: 1 }] })
  buildHouse(L, { x: 24, z: 25, w: 7, d: 6, h: 3.2, rot: Math.PI, col: '#c8c0e0', roof: 'flat', interior: false, windows: [{ side: 's', x: 0, y: 1.3, w: 1.2, h: 1 }] })
  buildHouse(L, { x: -24, z: -4, w: 8, d: 7, h: 3.2, rot: 0, col: '#e8d0a0', roof: 'tile', interior: false })
  buildHouse(L, { x: 17, z: -2, w: 8, d: 7, h: 3.2, rot: 0, col: '#cfd8c0', roof: 'flat', interior: false })
  for (let x = -20; x <= 80; x += 22) { pole(L, x, 11.2, 8); }
  for (let x = -20; x < 80; x += 22) wires(L, { x, y: 7.6, z: 11.2 }, { x: x + 22, y: 7.6, z: 11.2 }, 0.8)
  streetLight(L, 12, 11.6, false)
  const auto = autoRickshaw(); auto.position.set(-12, 0, 16); auto.rotation.y = Math.PI / 2; L.add(auto); L.walk.circle(-12, 16, 1.1); L.walk.circle(-12.7, 16, 1)
  const cw = cow(); cw.position.set(18, 0, 16.4); cw.rotation.y = 1.4; L.add(cw); L.walk.circle(18, 16.4, 0.9)
  const dg = dogModel(); dg.position.set(2, 0, 17.3); dg.rotation.y = 2; L.add(dg)
  // trees
  const tr = (x, z, s = 1) => { const g = new THREE.Group(); const t = cyl(g, 0.22 * s, 0.32 * s, 4 * s, withPBR(new THREE.MeshStandardMaterial({ map: tex.bark() })), 0, 0, 0, 8); for (let i = 0; i < 3; i++) sph(g, 1.8 * s, new THREE.MeshStandardMaterial({ map: tex.leaf(), color: '#7aa860' }), R.range(-0.8, 0.8), 4.4 * s + i * 0.5, R.range(-0.8, 0.8)); g.position.set(x, 0, z); L.add(g); L.walk.circle(x, z, 0.35 * s) }
  tr(-6, 9.5, 1.1); tr(9, 8.4, 1.2); tr(30, 19, 1.3); tr(-30, 19, 1.2); tr(40, 10, 1.1); tr(55, 18.5, 1.3); tr(65, 10, 1.2)
  // scooter parked on the street, facing +x (east: the way out of town)
  L.spawn = night ? { x: 2, z: 5, yaw: Math.PI } : { x: -2.2, z: -0.5, yaw: -2.36 }
  if (!night) {
    G.addScooter(L, 7.5, 14.6, Math.PI / 2)
  }
  // ambience
  L.isIndoors = (x, z) => (house.inside(x, z) ? 1 : 0)
  L.ambient = (S, p) => { const ins = house.inside(p.pos.x, p.pos.z); S.fan = ins ? 0.8 : 0; S.room = ins ? 0.6 : 0.1; S.traffic = night ? 0.0 : (ins ? 0.25 : 0.55); S.birds = night ? 0 : 0.6; S.insects = night ? 0.7 : 0 }
  L.sceneTick = 0
  return L
}
