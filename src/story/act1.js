// Chapter 1: A normal day. Home -> ride.
import { baseGoal, G, ui, audio, THREE, N, T, say, wait, load, startScene, endScene, setTime, compHold, compFollow, reveal, reach, fear, use, gate, snapTo, go } from './helpers.js'

export async function ch1(s) {
  G.clockRate = 0
  setTime(17.12, 0, false, true)
  const L = await load('home', {}, { dx: 1.4, dz: 1.2 })
  const H = L.house, c = G.comp
  c.place(...H.local(2.4, 0, -1.6).toArray().filter((v, i) => i !== 1), Math.PI)
  c.pose('sit'); c.mode = 'hold'; c.holdPos = null
  const mom = G.addActor('mother'); const mp = H.local(-3.1, 0, -1.4); mom.place(mp.x, mp.z, 0.5); mom.sfx = false
  mom.P.setPose('stand')
  G.clockRate = 30
  await startScene(2.2)
  ui.titleCard('CHAPTER 1', 'Ek aam din', 'Dopahar ke baad · Late afternoon', 3.4)
  await wait(0.8)
  ui.toast('WASD — chalo · Mouse — dekho · E — baat / use', 5)
  // 1. talk to Mummy
  ui.objective('Mummy se baat karo · Talk to Mummy')
  const t1 = use(H.local(-2.6, 1.2, -0.9), 'Mummy se baat karo', { r: 3.2, cone: 0.1 })
  await t1
  mom.face(G.player.pos); mom.look(G.camera.position)
  await N('Mummy, hum Nishant ke saath thoda ghoomne ja rahe hain.', 'Mom, Nishant and I are going out for a ride.')
  await say('Mummy', 'Kitni der mein aaoge? Shaam ko mausi aane wali hain.', 'When will you be back? Aunty is coming this evening.')
  await N('Shaam tak aa jayenge. Zyada late nahi hoga.', 'Back by evening. Won\'t be late.')
  await say('Mummy', 'Theek hai. Phone kar dena agar late ho.', 'Okay. Call me if you get late.')
  await N('Theek hai.', 'Okay.')
  mom.look(null); mom.face(null)
  // 2. helmets
  ui.objective('Helmet utha lo (darwaaze ke paas) · Pick up the helmet')
  ui.toast('Helmet utha lo — darwaaze ke paas', 4)
  c.mode = 'follow'; c.pose('stand')
  await use(L.refs.helmetPos, 'Helmet utha lo', { r: 3 })
  audio.clang(L.refs.helmetPos, 0.5)
  await T('Chal, chal. Sab set? Petrol bhi full karwaya tha kal.', 'Come on. All set? Filled up the tank yesterday.')
  await N('Haan, bas thoda ghoom ke aate hain.', 'Yeah, just a little roam.')
  ui.objective('Darwaaze se bahar nikalo, gate tak · Walk out through the front door to the gate')
  // 3. outside + neighbour
  await gate(() => G.player.pos.z > 11.3 && !H.inside(G.player.pos.x, G.player.pos.z), () => snapTo(2, 12.5), 0, [2, 13, 'Darwaaze se bahar, gali mein · Out into the street'])
  const nb = G.addActor('neighbor'); nb.place(11, 15.6, -1.4); nb.face({ x: G.player.pos.x, z: G.player.pos.z }); nb.sfx = false
  await wait(0.8)
  say('Padosi', 'Arre Nishan, kahan chale subah-subah?', 'Hey Nishan, where to?', { pos: nb.pos })
  await wait(2.4)
  await N('Bas ghoomne, uncle. Shaam tak lautenge.', 'Just roaming around, uncle. Back by evening.')
  await say('Padosi', 'Dhyaan se jaana. Aajkal baarish ka bharosa nahi.', 'Go safe. Rain is unpredictable these days.', { pos: nb.pos })
  nb.face(null)
  ui.objective('Scooter ke paas jao · Go to the scooter')
  // 4. scooter
  const sc = G.scooter
  await use(sc.chassis.position, 'Scooter start karo', { r: 3.2 })
  audio.init()
  ui.objective('Sadak par chalao · Ride down the road')
  G.rideHint = 'W — aage · A/D — mudo · Space — brake'
  G.dismountPending = false
  G.mount(sc); setTime(17.4, 0, false, true); G.clockRate = 45
  G.rideMax = 9
  await wait(0.4)
  await T('Chal bhai. Aaj toh road khali milegi.', 'Let\'s go. The road should be empty today.', { dur: 3 })
  await gate(() => sc.chassis.position.x > 20, () => snapTo(21, 14.5), 0, [22, 14.4, 'Sadak par scooter chalao (W) · Ride along the street'])
  G.rideHint = null
  await T('Kal ka match dekha? Arre, last over mein toh...', 'Did you watch yesterday\'s match? That last over...', { dur: 3.4 })
  await N('Haan yaar, kya finish tha!', 'Yeah, what a finish!', { dur: 2.2 })
  await gate(() => sc.chassis.position.x > 52, () => snapTo(53, 14.5), 0, [54, 14.4, 'Seedha aage · Keep going straight'])
  ui.objective(null)
  await ui.fade(1, 1.2)
}

import { ptAt } from '../world/common.js'
const rat = (L, d, label = 'Sadak par seedha chalte raho · Keep riding down the road') => { const q = ptAt(L.pts, d + 1); return { x: q.x, z: q.z, pts: L.pts, d: d + 1, label } }
const rsnap = (L, d) => { const q = ptAt(L.pts, d + 1); snapTo(q.x, q.z) }
export async function ch1b(s) {
  // the road out of town
  setTime(17.5, 0, false, true); G.clockRate = 40
  const L = await load('road', {}, false)
  const sc = L.scooter
  G.mount(sc)
  G.rideMax = 11
  await startScene(1.6)
  ui.toast('Space — brake · Shift se nahi, bas W dabao', 4)
  const proj = L.projDist
  { const e = ptAt(L.pts, L.roadLen - 16); baseGoal(e.x, e.z, 'Sadak ke aakhir tak, jungle ke mod par · Ride to the end of the road (forest turn)', L.pts, L.roadLen - 16) }
  await gate(() => proj(sc.chassis.position.x, sc.chassis.position.z) > 90, () => rsnap(L, 90))
  await T('Yaar, kitne dino baad aise nikle hain.', 'Man, it\'s been so long since we did this.', { dur: 3 })
  await gate(() => proj(sc.chassis.position.x, sc.chassis.position.z) > 260, () => rsnap(L, 260))
  await N('Aaj poora din bahar hi rehte hain. Ghar pe toh bas TV aur phone.', 'Let\'s stay out all day. At home it\'s just TV and phone.', { dur: 3.4 })
  await T('Ha ha, mummy ko bata diya na, shaam tak?', 'Ha ha, you told mom — by evening, right?', { dur: 2.8 })
  await gate(() => proj(sc.chassis.position.x, sc.chassis.position.z) > 430, () => rsnap(L, 430))
  await N('Yaar, dukaane khatam ho gayi. Itni door aa gaye?', 'The shops are gone. Have we come this far?', { dur: 3 })
  await T('Aage ek jungle jaisa hai na? Mere cousin ne bataya tha, bahut sundar jagah hai.', 'There\'s a forest ahead, right? My cousin said it\'s beautiful.', { dur: 3.8 })
  await gate(() => proj(sc.chassis.position.x, sc.chassis.position.z) > L.roadLen - 30, () => rsnap(L, L.roadLen - 14), 0, rat(L, L.roadLen - 16, 'Sadak ke aakhir tak, jungle ke mod par · To the end of the road, the forest turn'))
  await ui.fade(1, 1.2)
}
