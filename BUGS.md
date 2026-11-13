# BUGS / STATUS (honest)

## Fixed and verified (headless, real key events)
- **Ch1 cannot leave the house**: the door-approach walk zone was ~0.26 m wide after the 0.35 m player radius. It is now widened. Spawn faces the door and an OBJECTIVE HUD was added. Verified: real W key + steering reaches z=11.6 (the gate).
- **Chapter 4 (bamboo/storm) near-black**: mean luminance was ~11/255. Night/storm/rain/deep/still moods were brightened (ambient, hemisphere, horizon, moon). Re-measured ~13.5 only, so it is still very dark. Not fully fixed; see Open.
- **Scooter keeps falling**: wheel track was 0.14 m, so it tipped over. Now 0.48 m track, lower centre of mass, angular factor limits, anti-roll self-righting, stiffer suspension. Test: 7 manoeuvres (steer left/right, brake, reverse) at 60 Hz, 0 falls, min up-vector 0.9998. Autopilot-style steering along the ch2 road also ran with no fall.

## Voice
- The old fake "babble" (voiceTick) is replaced by real recorded clips: Piper neural TTS, Hindi (Devanagari via tools/lexicon.txt) and English, a different voice per character, whisper filter, subtitle timing from real clip length.
- Settings: Voice language (Hinglish voices / English voices / none).
- Regenerate: `python3 tools/extract_lines.mjs` (node) then `python3 tools/make_voice.py` (models in tools/models, not committed).
- Not verified: how it sounds. Hindi quality of Piper is mid-level and the Devanagari lexicon was hand-written, so some pronunciations may be off. I did not run a transcription check.

## Open (NOT done)
- Graphics are still the procedural low-poly look (no PBR textures, HDRI, post-processing, glTF characters or detailed houses). This is the biggest gap against the "GTA 5" request and cannot be matched in this stack.
- Ch4 still very dark; night horizon "comb" artifact; cow looks like a sheep; ceiling/wall texture smear.
- UI overhaul (menu 3D background, loading screen, settings polish) not started; only the objective HUD and the voice-language option were added.
- No soft-lock guards on the other chapters' interact gates; the full real-input playthrough of all chapters was not run.
- Voice clips: see /tmp/mv.log status in the summary.


## Status update (latest session)
### Fixed / done
- Voice: 243 Hinglish + 240 English Piper neural clips rendered (the rest are silent "..." / stage-direction lines by design). Transcribed samples back word-for-word in both languages; both languages load and play in-browser with no errors. Settings > Voice language (Hinglish / English / None).
- Lip-sync: the speaking character's mouth opens from the clip amplitude.
- Chapter 4 (bamboo/storm) no longer black: per-mood exposure is now wired to the renderer, ambient raised, torch wider/brighter (mean luminance 12 -> ~19/255; bamboo, path and torch pool are readable).
- Graphics: 17 Poly Haven CC0 PBR sets (diffuse + normal + roughness) now drive plaster, mud, brick, roof tile, tin, wood, cement, floor tile, earth, stone, bark, grass, road; world-scaled UVs on boxes; MSAA; soft sun shadows (Medium/High); woven-cloth normal map on clothes; capsule limbs and smoother heads.
- Earlier: ch1 door exit, scooter tipping, objective HUD.
### Still open (honest)
- Not GTA-5 fidelity: characters are still procedural (smoother, but stylised). No skinned glTF humans, no post-processing (SSAO/bloom), no HDRI sky, no glTF vegetation.
- Chapters 3-6 are still dark by design (~12-23/255); no UI overhaul (menu 3D bg, loading screen, rebinding); F3 debug overlay not built.
- Night horizon "comb", cow looks like a sheep, ceiling/wall smear, bare street in home.js.
- No soft-lock hints on later gates; no full real-input playthrough beyond ch1 (autopilot runs verified).
- AppImage/deb not rebuilt this session (`npm run dist`); texture/voice assets add ~50 MB.
