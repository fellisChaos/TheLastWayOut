# THE LAST WAY OUT

A grounded, first-person psychological horror game for **Ubuntu desktop** (Electron + Three.js).
You are **Nishan**. Your friend **Nishant** is lost with you on a scooter in a forest in rural India.
Everything is built from code: procedural graphics, physics, and synthesised sound. There are no external assets.

At the end, the game shows **Asli Sach** ("the real truth"). These cards explain the sounds, shapes and legends you met, in Hinglish and English.

## Run on Ubuntu

```bash
# one-time: Node.js 18+  (sudo apt install nodejs npm)
cd webapp
./run.sh            # installs deps on first run, builds, opens the desktop window
```

Other options:

| Command | What it does |
|---|---|
| `npm install && npm start` | build + open in Electron |
| `npm run web` | build + serve at http://localhost:3000 (any browser) |
| `npm run dist` | build `release/*.AppImage` and `release/*.deb` (electron-builder) |
| `the-last-way-out.desktop` | launcher entry; copy to `~/.local/share/applications/` |

Needs a GPU with WebGL2. In-game quality options are in Settings.
**F11** toggles fullscreen.

## Controls

| Desktop | Action |
|---|---|
| W A S D / mouse | move / look |
| Shift | run (not while pushing the scooter) |
| C | crouch |
| E | interact |
| F | torch |
| P | phone |
| Space | scooter brake |
| Esc | pause / settings |

Touch controls are also included. Accessibility options: bilingual subtitles (Hinglish + English), sound captions, volume sliders, reduced shake and flash.

## Story (about 35 to 45 minutes)

c1 A normal day, then the ride, c2 the forest and the repeating paths, c3 bamboo shade in a storm, c4 the man and the voices,
c5 deeper into the forest, c6 the peepal tree and the flickering light, c7 the village and the knock, c8 inside the house (the red drink),
c9 the uncle's two friends, c10 the shadow, c11 the cremation ground (the clock freezes at 4:00 AM).

At c11 **you choose**:
- **Ending A**: follow the direction the uncle pointed. The forest, a punctured tyre, and phone signal at the road. Back home you learn the tiffin was left at home and there is no village there.
- **Ending B**: stay at the cremation ground. A figure strikes a samadhi, voices from behind, and the tall figure (you faint, with no chase). An ordinary stranger wakes you and explains. Over tea, the red drink question comes back.

Both endings leave the red-drink question unanswered. The game never identifies the drink or confirms that the uncle was a ghost.

## Reality cards (the post-game report)

21 cards cover the following:
- walking in circles (Souman 2009)
- bamboo "voices" and wind
- familiar voices heard from far away (auditory pareidolia)
- payal sounds from rattling siris pods
- footsteps and echoes
- the cold gust
- shadows and the autokinetic effect
- the Third Man factor
- repeating lights
- eyeshine and tapetum lucidum
- microsleep and fatigue
- peepal and banyan CO2 myth versus reality
- storm, animal and "if you are lost" safety tips (STOP, 112)

A few cards are marked as **unknown**: the village, the laugh, the samadhi, the drink. These are deliberately not explained.
Cards unlock as you meet each event and are saved in localStorage.

## Tech

- Vite 5 + Three.js 0.170 + cannon-es (scooter `RaycastVehicle`). Plain JS ES modules.
- Levels (`src/levels/*.js`) are lazy-loaded. Chapters (`src/story/act*.js`) are async scripts that run through `story.js`, a state machine with branch A/B.
- Headless test hooks: `?ch=<chapter index>&auto=1` (or `auto=b` for branch B), `&fast=6` (simulate faster than real time). These are used for Playwright smoke tests.

## Status

- Verified in headless Chromium (software WebGL): every chapter and both full endings run to the end card with no console errors. I checked screenshots of several scenes.
- Full autoplay QA, both endings: Ending A (ch1 -> 13a end card) and Ending B (-> 14b end card) run clean, no console errors. This is scripted autopilot, NOT a human playthrough.
- Packages built in this sandbox: `release/The Last Way Out-1.0.0.AppImage` (169 MB) and `release/the-last-way-out_1.0.0_amd64.deb` (132 MB). `dpkg-deb -I` reads the deb fine.
- **Not verified:** the Electron window was not launched (the sandbox has no libgtk-3), and no real GPU / frame-rate test. Test on your machine. If the window fails, `./run.sh` (browser/Electron dev) is the fallback. deb needs: `sudo apt install ./release/the-last-way-out_1.0.0_amd64.deb`; AppImage: `chmod +x` then run (add `--no-sandbox` if your kernel blocks user namespaces).
- Building the deb in a low-RAM box: `TMPDIR=$HOME/tmpbuild npx electron-builder --linux deb` (a small /tmp tmpfs breaks the fpm tar step).
- Visuals: night horizon checked in a screenshot (clean, no comb); cow redrawn as a zebu (hump, horns, dewlap) but still a primitive-shape model; characters are still procedural/stylised, NOT GTA-5 fidelity; no bloom/SSAO.
- UI added: Settings has FOV and subtitle-size sliders, loading overlay between levels, F3 debug overlay. Key rebinding and a 3D menu background are NOT done.

## Navigation (new)
- `M` full map (you, facing cone, route, goal, Nishant, scooter; wheel/+/- zoom), minimap + compass always on HUD, gold diamond in the world.
- `H` hint, `H` twice = hop a few metres ahead along the route if you are ever stuck. `Shift` sprint with stamina bar.
- Settings > Navigation aid to choose full / compass only / off.
