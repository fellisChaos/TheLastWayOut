// Story state machine: chapters run in order; chapter 11 decides branch A or B.
import { G, ui } from './helpers.js'
import { ch1, ch1b } from './act1.js'

export const CHAPTERS = [
  { id: 'c1', title: 'Ek aam din — A normal day', run: async (s) => { await ch1(s); await ch1b(s) } },
]
let token = 0
export function stopStory() { token++; G.abort() }
export async function play(idx, { onEnd }) {
  const my = ++token
  G.abort(); G.beginRun(); G.flags = G.flags || {}; const s = { onEnd, branch: null, idx }
  G.flags = {}
  try {
    for (let i = idx; i < CHAPTERS.length; i++) {
      const c = CHAPTERS[i]
      if (c.branch && c.branch !== s.branch) continue
      if (my !== token) return
      s.idx = i; await c.run(s)
    }
  } catch (e) { if (e !== 'abort') throw e }
}
