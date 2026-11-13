// Chapters 2-4: forest outing + loop, storm in the bamboo shade, the man and the voices.
import { G, ui, audio, THREE, N, T, say, wait, load, startScene, endScene, setTime, compHold, compFollow, reveal, fear, tired, use, gate, snapTo, go, goTrail, trailLen, lookFor, focus, around, stepsAt, spawn, caption, shake } from './helpers.js'
import { ptAt } from '../world/common.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)

export async function ch2(s) {
  setTime(18.35, 0, false, true)
  const L = await load('forest', {}, { dx: 0.8 })
  const sc = L.scooter, c = G.comp
  L.refs.can.visible = false
  G.hasSignal = true
  G.mount(sc); G.rideMax = 8; G.rideHint = 'W — aage · A/D — mudo · Space — brake'
  await startScene(1.8)
  ui.titleCard('CHAPTER 2', 'Jungle ki taraf', 'Shaam · Evening', 3.2)
  G.clockRate = 12
  await T('Wah yaar, kitni shaant jagah hai.', 'Wow, this place is so peaceful.', { dur: 3 })
  await goTrail(L.stemPts, 50, 0)
  G.dismount(); G.rideHint = null; G.rideMax = 11
  ui.toast('Ab paidal — raaste par chalo', 4)
  await N('Scooter yahin laga dete hain. Aage ka raasta patla hai.', 'Let\'s park it here. The path ahead is narrow.')
  await T('Chal, ek chakkar maar ke aate hain. Mere cousin ne kaha tha ek khuli jagah hai andar.', 'Come on, let\'s take a walk. My cousin said there\'s a clearing inside.')
  // walk the ring to clearing A
  await gate(() => G.distToPlayer(0, 114) < 6, () => snapTo(0, 113))
  setTime(18.7, 0, false, true)
  ui.toast('Selfie ke liye E dabao', 3.5)
  await use(V(4.5, 1.3, 120.5), 'Selfie lo — split tree ke saath', { r: 6, cone: -1 })
  audio.flash(); ui.flash(0.55)
  await T('Ha ha! Tera muh toh band hi nahi hota. Ek aur?', 'Ha ha! You never keep a straight face. One more?', { dur: 3 })
  await use(L.refs.rockPos, 'Khaali can yahin rakh do', { r: 6, cone: -1 })
  L.refs.can.visible = true; audio.clang(L.refs.rockPos, 0.5)
  await N('Plastic jungle mein nahi chhodte. Par ye chhota sa hai — wapas aate waqt utha lenge.', 'Not leaving plastic in the forest. I\'ll pick it up on the way back.')
  G.env.set('dusk'); setTime(19.15, 0, false, true); G.clockRate = 20
  await T('Yaar, andhera hone laga hai. Chalein?', 'Man, it\'s getting dark. Shall we go?', { dur: 3 })
  await N('Haan. Mummy ko shaam tak bola tha.', 'Yeah. I told Mom by evening.', { dur: 2.6 })
  G.hasSignal = false; G.checkPhone()
  await N('Network aa raha hai?', 'Is there network?')
  await T('Nahi. Ek baar aur try karta hoon.', 'No. Let me try once more.')
  await N('Shaam tak pahunchne bole the. Ab ghar pe tension hoga.', 'We said we\'d be back by evening. They\'ll be worried now.')
  await T('Pehle bahar nikalte hain. Phir call kar lenge.', 'Let\'s get out first. We\'ll call after.')
  L.blockStem(); G.env.set('night')
  ui.toast('Jis raaste se aaye the — wapas chalo', 4)
  await gate(() => G.distToPlayer(0, 65.5) < 8.5, () => snapTo(0, 66))
  await T('Ruk... yahan toh raasta tha na?', 'Wait... wasn\'t there a path here?')
  await N('Haan, hum yahin se toh aaye the. Ye jhaadiyaan...', 'Yes, we came right through here. These bushes...')
  await T('Andhera hai, shayad mod chhoot gaya. Doosra raasta dekhte hain.', 'It\'s dark, we must have missed a turn. Let\'s look for another way.')
  await gate(() => G.distToPlayer(0, 114) < 7, () => snapTo(0, 113))
  setTime(19.9, 0, false, true)
  const tree = V(4.5, 5, 123)
  await lookFor(tree, 0.8, 0.9)
  G.alertComp(tree, 3)
  await T('Ruk... ye ped pehle bhi dekha hai.', 'Wait... I\'ve seen this tree before.')
  await N('Jungle mein sab ped same lagte hain.', 'All trees look the same in a forest.')
  await T('Nahi. Iske side mein woh tooti hui branch thi. Hum idhar se pehle nikal chuke hain.', 'No. There was that broken branch on its side. We\'ve passed here already.')
  await N('Toh hum circle mein aa rahe hain kya?', 'So are we going in circles?')
  reveal('loop', 'lost')
  await T('Chal, ulti taraf try karte hain.', 'Come on, let\'s try the other direction.', { dur: 2.6 })
  ui.toast('Uttar ki taraf ka patla raasta', 4)
  await goTrail(L.tbPts, trailLen(L.tbPts) - 4)
  G.env.set('drizzle')
  G.alertComp(L.refs.canPos, 3)
  await T('Ye... ye kya hai?', 'What... is that?', { dur: 2 })
  await focus(L.refs.canPos, async () => {
    await N('Ye toh wahi can hai. Wahi, usi tarah ka... jaise humne wahan chhoda tha.', 'That\'s the same can. Just like the one we left back there.')
    await T('Pagal mat ban. Yahan kaun aur chhodega?', 'Don\'t be silly. Who else would leave one here?')
    await N('Yaar... mujhe thik nahi lag raha.', 'Man... I don\'t like this.')
  })
  audio.thunder(2.4); fear(0.3)
  await T('Baarish aa rahi hai. Kahin chhup jaana padega.', 'Rain is coming. We\'ll have to find cover.', { dur: 3 })
  G.env.set('rain'); await wait(1.5)
  await endScene(1.4)
}

export async function ch3(s) {
  setTime(22.6, 0, false, true)
  const L = await load('bamboo', { env: 'storm', scooter: true }, { dx: 1.2 })
  const c = G.comp
  G.hasSignal = false
  await startScene(1.8)
  ui.titleCard('CHAPTER 3', 'Baans ki chhaaon', 'Raat · Night', 3.4)
  G.clockRate = 20; fear(0.2); tired(0.5)
  await T('Wahan dekh — baans ka jhund. Wahin ruk jaate hain.', 'Look there — a bamboo grove. Let\'s wait there.', { dur: 3 })
  ui.toast('Scooter dhakelte hue andar chalo', 4)
  await gate(() => G.distToPlayer(0, 44) < 5, () => snapTo(0, 44))
  G.stopPush(); G.noRun = false
  const sc = G.scooter; sc.place(2.6, 41, 0.35)
  c.mode = 'hold'; c.holdPos = { x: -2.2, z: 45 }
  await wait(0.6)
  ui.toast('F — torch jalao', 5)
  if (G.auto) G.torchOn = true; else await G.until(() => G.torchOn, 30)
  await N('Gila hai sab. Koi jagah dikhti hai?', 'Everything\'s soaked. Can you see any place?')
  await wait(1.5)
  await T('Bas baans, patte, keechad... aur kuch nahi.', 'Just bamboo, leaves, mud... nothing else.', { dur: 2.8 })
  c.pose('rub')
  await N('Abhi bahar jaana bekaar hai. Baarish kam hone do.', 'Going out is pointless now. Let the rain ease first.')
  await T('Subah tak rukna pada toh?', 'What if we have to wait till morning?')
  await N('Pehle baarish rukne de. Phir kuch sochenge.', 'Let the rain stop first. Then we\'ll think.')
  await T('Ghar pe kya bolenge?', 'What will we tell them at home?')
  await N('Network aane de. Sabse pehle call karenge.', 'Let the network come. First thing, we call.')
  G.checkPhone()
  reveal('storm', 'bamboo')
  // the long quiet stretch (no scares): rain, wind, drips, an occasional thunderclap
  setTime(23.0, 0, false, true); G.clockRate = 340
  ui.toast('Thodi der yahin baitho. Aaram se aas-paas dekho.', 5)
  const quiet = [8, 14, 22, 30, 38]
  let t0 = 0
  for (const t of quiet) { await wait(t - t0); t0 = t; if (t === 14 || t === 30) { G.env.strike(1.6) } if (t === 22) caption('[rain drips from the bamboo leaves]', 3) }
  await wait(8)
  await endScene(1.6)
}

export async function ch4(s) {
  setTime(2.2, 0, false, true)
  const L = await load('bamboo', { env: 'storm', scooter: true, push: false }, { dx: 1.2 })
  const c = G.comp; G.hasSignal = false
  // restore the shelter state
  G.scooter.place(2.6, 41, 0.35); G.player.pos.set(0.4, 0, 46.3); G.player.yaw = 0.2
  c.place(-2.2, 45, 0.4); c.mode = 'hold'; c.holdPos = { x: -2.2, z: 45 }; c.pose('rub'); G.torchOn = true
  G.player.canMove = true
  await startScene(1.8)
  ui.titleCard('CHAPTER 4', 'Raat ke 2 baje', '2:10 AM', 3.4)
  G.clockRate = 15; fear(0.35); tired(0.7)
  await wait(3)
  // the man walking into the forest
  const out = L.trails[1].pts, a = ptAt(out, 24)
  const man = G.addActor('shadow'); man.place(a.x, a.z, a.yaw); man.sfx = false
  const far = ptAt(out, 140)
  await T('Woh kaun tha?', 'Who was that?', { dur: 1.8 })
  man.walkTo(far.x, far.z, 1.25)
  await G.turnTo(V(a.x, 1.5, a.z), 0.9)
  await N('Pata nahi. Idhar is time kaun ghoomega?', 'No idea. Who walks around here at this hour?')
  await T('Peeche jaayein?', 'Should we follow?')
  await N('Pagal hai? Hum khud raasta bhool gaye hain. Yahin reh.', 'Are you mad? We ourselves are lost. Stay here.')
  await wait(3)
  G.removeActor(man)
  reveal('man')
  await wait(2.5)
  // voices
  const p1 = around(32, 0.8, 1.2)
  audio.call(p1, 'mother', 0)
  await say('Awaaz', 'Nishaaan... ghar aa ja beta...', '(a familiar voice calls: come home, son...)', { pos: p1, voice: false, dur: 3.4 })
  await T('Tune suna? Ye... aunty ki awaaz jaisi thi.', 'Did you hear that? It sounded like Mom.')
  await N('Mummy yahan kaise aayengi? Torch dikha.', 'How could Mom be here? Shine the torch.')
  caption('[you sweep the torch beam around the grove]', 2.4)
  await wait(2.5)
  await N('Koi nahi hai.', 'There\'s nobody.')
  await wait(1.5)
  const p2 = around(26, -2.1, 1.0)
  audio.call(p2, 'father', 1)
  await say('Awaaz', 'Nishant... Nishaaan... idhar aao...', '(another familiar voice, from the other side...)', { pos: p2, voice: false, dur: 3.2 })
  await T('Ab dusri taraf se? Direction hi samajh nahi aa rahi.', 'Now from the other side? I can\'t make out the direction at all.', { dur: 3 })
  await N('Hum jaante hain wo yahan nahi hain. Fir bhi awaaz itni jaani-pehchaani...', 'We know they\'re not here. Yet the voice feels so familiar...')
  reveal('parent')
  await wait(2.5)
  audio.payal(around(14, 1.0, 0.6)); fear(0.5)
  await wait(2.5)
  const sp = around(7, 2.0, 0.4); stepsAt(sp, 4, 0.55)
  await wait(3.2)
  await T('Kadam... chaar? Nahi, paanch...', 'Footsteps... four? No, five...', { dur: 2.6 })
  stepsAt(around(9, -1.0, 0.5), 6, 0.45); await wait(3.5)
  caption('[the wind through the bamboo sounds almost like a name]', 3.2)
  await wait(1.5)
  audio.puff(1); G.camShake(0.35)
  await T('Kaan ke paas... kisi ne phoonk maari!', 'Something blew right near my ear!', { dur: 2.6 })
  c.alertComp = null
  await wait(2)
  // a shadow crossing the torch beam
  const P = G.player.pos, f = { x: Math.sin(G.player.yaw), z: Math.cos(G.player.yaw) }
  const sh = G.addActor('shadow'); sh.sfx = false
  sh.place(P.x + f.x * 7 - f.z * 5, P.z + f.z * 7 + f.x * 5, 0); sh.walkTo(P.x + f.x * 7 + f.z * 5, P.z + f.z * 7 - f.x * 5, 3.6)
  await wait(2.2); G.removeActor(sh)
  await N('Wo kya tha?! Kuch... guzra torch ke saamne.', 'What was that?! Something crossed the beam.', { dur: 2.8 })
  reveal('payal', 'steps', 'puff', 'shadow')
  await T('Yahan nahi ruk sakte. Chal, kahin roshni dhoondte hain — shayad road tak pahunch jaayein.', 'We can\'t stay here. Come on, let\'s look for a light — maybe it leads to a road.', { dur: 4 })
  await N('Theek hai. Scooter saath le chalte hain.', 'Okay. We\'ll take the scooter along.')
  await endScene(1.6)
}
