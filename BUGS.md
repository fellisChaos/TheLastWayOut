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
