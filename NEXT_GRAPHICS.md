# Graphics upgrade plan (research done, NOT yet implemented)

All sources below were fetched and render-tested in a standalone three.js viewer.

## Animals (skinned, animated, CC0 Quaternius, ~650 KB each)
Base: https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/animals_pack/{Cow,Bull,Donkey,Horse,ShibaInu,Husky}.glb
Clips: Idle, Idle_2, Idle_Headlow, Eating, Walk, Gallop (prefix `AnimalArmature|`). Low-poly, no zebu hump (add a hump mesh or scale the shoulder bone).
Replace `cow()` / `dogModel()` in `src/world/build.js` with GLTFLoader + AnimationMixer.

## Scooter
Detailed textured Vespa (5.9 MB, 37k tris, 6 textures): https://media.githubusercontent.com/media/VictorQuerinoMartins/webgpu-vs-webgl-benchmark/main/public/objetos/vespa.glb  (Git LFS: use media.githubusercontent.com, raw.* returns a pointer file)
Wheels are NOT separate nodes (single merged mesh, 533 loose parts) -> wheels need to be split by vertex cluster (bbox of the two wheel clusters) so they can spin/steer, or keep procedural wheels and use the Vespa body only. Licence of that repo not verified: check before shipping.
Light fallback: https://media.githubusercontent.com/media/ssebs/DankNooner/main/v2/player/bikes/assets/Vespa/Vespa.glb (76 KB, 1.7k tris, separate FrontWheel/RearWheel nodes).

## People
- Quaternius modular_men / modular_women GLB (skinned, 49 bones, 5-6k tris, CC0): .../glb/modular_men/{Farmer,Casual,Casual2}.glb, modular_women/{Casual,Formal}.glb. No animations bundled; animations come from the Quaternius "Animated Men/Women" FBX packs (Man_Idle, Man_Walk, Man_Run, Man_Sitting...) in beep2bleep/FreeAssetsByKenneyNLandQuaternius (needs retarget: bone names differ).
- Honest assessment: still stylised low-poly Western clothing. Re-tinting skin is easy; kurta/dhoti/saree would need extra cloth meshes. Not GTA-5 fidelity.
- Ready Player Me sample (three.js examples `readyplayer.me.glb`, 15.8k tris, PBR textures) is the most realistic available, but dressed in a Western suit.

## Reflections / sky
Poly Haven HDRIs (CC0, `api.polyhaven.com`): kloofendal_48d_partly_cloudy_puresky (day), qwantani_dusk_2_puresky (dusk), moonless_golf / dikhololo_night (night), evening_road_01_puresky. Plan: RGBELoader + PMREMGenerator -> `scene.environment` (1k-2k .hdr), wet-road roughness lowering in rain, MeshStandardMaterial envMapIntensity per mood. Add EffectComposer: GTAO/SAO + UnrealBloom + vignette on 'high' only.

## Voice
Done: tools/make_voice_edge.py (edge-tts neural voices, one per character, lexicon-based Devanagari). Missing voice for Uncle fixed (extract_lines.mjs now catches `U(...)`).
Ideas: per-line SSML styles are not exposed by edge-tts 7.x; upgrade path = a local neural model with emotion (not available offline here).
