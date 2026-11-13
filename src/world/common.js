// shared helpers for level modules
import * as THREE from 'three'
import { Level } from './build.js'
import { scatterForest } from './nature.js'
import { nearestOnPoly } from '../core/util.js'

// Catmull-Rom smoothing of a polyline -> dense points
export function smoothPts(pts, per = 6) {
  const P = pts.map(p => (Array.isArray(p) ? { x: p[0], z: p[1] } : p)), out = []
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)]
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z) })
    }
  }
  out.push(P[P.length - 1]); return out
}
export const polyLen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); return l }
export function ptAt(pts, d) { // point at distance d along polyline
  let acc = 0
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); if (acc + l >= d) { const k = (d - acc) / l; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * k, yaw: Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z) } } acc += l }
  const a = pts[pts.length - 2], b = pts[pts.length - 1]; return { x: b.x, z: b.z, yaw: Math.atan2(b.x - a.x, b.z - a.z) }
}
// distance travelled along polyline for nearest point
export function projDist(pts, x, z) {
  let best = 1e9, bd = 0, acc = 0
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1].x, az = pts[i - 1].z, bx = pts[i].x, bz = pts[i].z, dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-6
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz), l = Math.sqrt(l2)
    if (d < best) { best = d; bd = acc + l * t } acc += l
  }
  return bd
}

// A forest level made of trails. o: {name, trails:[{pts,hw,tex,rep,y}], bounds, density, seed, ground:'grass', tint, avoid, groundSize}
export function forestLevel(G, o) {
  const L = new Level(G, o.name)
  const gs = o.groundSize || [500, 700, 0, 0]
  L.ground(gs[0], gs[1], o.ground || 'grass', 7, gs[2], gs[3], o.groundColor || 0xffffff)
  for (const t of o.trails) {
    t.pts = smoothPts(t.pts, 6)
    if (!t.noRibbon) t.mesh = L.ribbon(t.pts, t.hw * 0.95, t.tex || 'mud', t.rep || 3, t.y || 0.012, t.color || 0xffffff)
    if (!t.noWalk) L.walk.corridor(t.pts, t.hw, t.name || 'trail')
  }
  if (o.bounds) L.add(scatterForest(G, { bounds: o.bounds, trails: o.trails, density: o.density || 0.05, seed: o.seed || 3, avoid: o.avoid || [], walk: L.walk, tint: o.tint }))
  const trails = o.trails
  L.surface = (x, z) => { for (const t of trails) if (nearestOnPoly(t.pts, x, z).d < t.hw) return t.surface || 'mud'; return 'grass' }
  L.trails = trails
  return L
}
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z)

// point at distance d along polyline, offset sideways by off (positive = left of travel direction)
export function sideAt(pts, d, off = 0) {
  const p = ptAt(pts, d), nx = Math.cos(p.yaw), nz = -Math.sin(p.yaw)
  return { x: p.x + nx * -off, z: p.z + nz * -off, yaw: p.yaw }
}
