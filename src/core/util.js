export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt))
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
export const TAU = Math.PI * 2
export const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d }

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export class RNG {
  constructor(s = 1) { this.f = mulberry32(s) }
  next() { return this.f() }
  range(a, b) { return a + (b - a) * this.f() }
  int(a, b) { return Math.floor(this.range(a, b + 1)) }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)] }
  sign() { return this.f() < 0.5 ? -1 : 1 }
}
export const R = new RNG(Date.now() & 0xffff)

function hash(ix, iy) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
export function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy)
}
export function fbm(x, y, o = 4) {
  let s = 0, a = 0.5, f = 1
  for (let i = 0; i < o; i++) { s += a * noise2(x * f, y * f); f *= 2; a *= 0.5 }
  return s
}

// distance from point to polyline; returns {d, t(index+frac), x, z}
export function nearestOnPoly(pts, x, z) {
  let best = { d: 1e9, t: 0, x: 0, z: 0 }
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x, az = pts[i].z, bx = pts[i + 1].x, bz = pts[i + 1].z
    const dx = bx - ax, dz = bz - az
    const l2 = dx * dx + dz * dz || 1e-6
    let t = ((x - ax) * dx + (z - az) * dz) / l2
    t = clamp(t, 0, 1)
    const px = ax + dx * t, pz = az + dz * t
    const d = Math.hypot(x - px, z - pz)
    if (d < best.d) best = { d, t: i + t, x: px, z: pz }
  }
  return best
}
export const fmtClock = (h) => {
  let hh = Math.floor(h) % 24; const mm = Math.floor((h - Math.floor(h)) * 60)
  const ap = hh >= 12 ? 'PM' : 'AM'; let h12 = hh % 12; if (h12 === 0) h12 = 12
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`
}

// tileable value noise (period p)
function phash(ix, iy, p) {
  ix = ((ix % p) + p) % p; iy = ((iy % p) + p) % p
  return hash(ix, iy)
}
export function pnoise(x, y, p) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy
  const a = phash(ix, iy, p), b = phash(ix + 1, iy, p), c = phash(ix, iy + 1, p), d = phash(ix + 1, iy + 1, p)
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy)
}
export function pfbm(x, y, p, o = 4) {
  let s = 0, a = 0.5, f = 1, n = 0
  for (let i = 0; i < o; i++) { s += a * pnoise(x * f, y * f, p * f); n += a; f *= 2; a *= 0.5 }
  return s / n
}
