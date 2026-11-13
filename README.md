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
- **Not yet verified:** a real GPU (frame rate), the Electron window, and AppImage/deb building. They were not run in this sandbox.
- Known visual bug (NOT fixed): at night, in forest/cremation-ground scenes, a ragged row of dark tree-trunk stubs shows along the far horizon. They are darker than the fog/sky behind them. I lowered tree polygon counts and put the sky through tone-mapping, but the screenshot after that still shows it. Next step is to make the fog colour match the sky horizon, or add a dense fog wall at the edge of each level's bounds.
- Other rough edges: low-poly look, face textures, companion AI, and the cow model looks like a sheep. Triangle counts in forest levels are high. If it stutters, lower the quality in Settings.
