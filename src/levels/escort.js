// Chapter 9-10: the forest path out of the village, with hiding spot and the shadow crossing.
import * as THREE from 'three'
import { forestLevel, clearing, nightTick, shakyBush, makeSnake, ptAt, sideAt } from '../world/common.js'
import { makeRock, makeLog } from '../world/nature.js'
import { bush } from '../world/build.js'

export function build(G, opts = {}) {
  G.env.set('deep', true)
  const pts = [[0, -10], [0, 30], [8, 70], [-4, 110], [-14, 150], [-6, 190], [6, 226], [2, 262], [0, 290]]
  const L = forestLevel(G, { name: 'escort', trails: [{ pts, hw: 1.3, name: 'path', tex: 'mud' }], bounds: [-90, -30, 90, 330], density: 0.04, seed: 77, groundSize: [300, 460, 0, 140], avoid: [{ x: 0, z: -10, r: 4 }], groundColor: 0xa8b0a0 })
  L.pathPts = L.trails[0].pts
  // hiding spot: large tree and thick bushes by the path
  const hp = sideAt(L.pathPts, 175, 2.5), hp2 = sideAt(L.pathPts, 176.5, 3.5)
  L.refs.hide = new THREE.Vector3(hp.x, 0, hp.z)
  L.walk.disc(hp.x + 0.0, hp.z, 1.8, 'hide')
  for (let i = 0; i < 4; i++) { const b = bush(1.8); const s = sideAt(L.pathPts, 172 + i * 1.7, 4.2 + (i % 2) * 0.6); b.position.set(s.x, 0, s.z); L.add(b) }
  // bush that whispers / moves
  const wp = sideAt(L.pathPts, 100, 2.6); L.shaky = shakyBush(L, bush, wp.x, wp.z, 1.5); L.refs.bushPos = new THREE.Vector3(wp.x, 0.6, wp.z)
  // snake
  L.snake = makeSnake(); L.add(L.snake)
  L.refs.snakeAt = sideAt(L.pathPts, 128, 0)
  L.spawn = { x: 0, z: -6, yaw: 0 }
  L.surface = () => 'mud'
  nightTick(L, G, { owl: 0.5, dog: 0.5, jackal: 0.4 })
  return L
}
