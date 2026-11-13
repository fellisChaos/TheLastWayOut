#!/usr/bin/env python3
"""Pre-renders every story line to public/voice/{hi,en}/<id>.ogg using Piper TTS (offline neural voices).
 hi = Hindi/Hinglish (Devanagari via tools/lexicon.txt), en = English.  Run: python3 tools/make_voice.py [--force]
Models are downloaded into tools/models (see README).  Writes durations into public/voice/lines.json."""
import json, os, re, subprocess, sys, wave
from piper import PiperVoice
from piper.config import SynthesisConfig
_VOICES = {}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
FORCE = '--force' in sys.argv
L = json.load(open('public/voice/lines.json'))
EXTRA = {  # lines spoken through ui.say/audio.voiceTick with custom ids
  'awaaz_1': ('Awaaz', 'Yahan kya kar rahe ho?', 'What are you doing here?'),
  'awaaz_2': ('Awaaz', 'Nishaan... Nishaant...', 'Nishan... Nishant...'),
  'awaaz_3': ('Awaaz', 'Bhai... rasta kho gaya hoon.', 'Brother... I have lost my way.'),
}
for k, (w, h, e) in EXTRA.items(): L.setdefault(k, {'who': w, 'hi': h, 'en': e, 'src': 'extra'})
lex = {}
for tok in open('tools/lexicon.txt', encoding='utf8').read().split():
    a, b = tok.split('='); lex[a] = b
def dev(t):
    t = re.sub(r'\([^)]*\)\s*', '', t).replace('’', "'")
    def w(m):
        x = m.group(0).lower()
        return lex.get(x, x)
    t = re.sub(r"[A-Za-z]+", w, t)
    t = re.sub(r'\.\.\.|…', '…', t); t = t.replace('—', ',').replace('…', ',') if False else t.replace('—', ', ')
    t = re.sub(r'(?<=[ा-ौ\u0900-\u097F])\.(?=\s|$)', '।', t)
    return t.strip()
def en_clean(t): return re.sub(r'\([^)]*\)\s*', '', t).replace('—', ', ').strip()
# who -> (hindi model, english model, pitch factor hi, pitch hi/en, tempo)
V = {
  'Nishan':   ('hi_IN-pratham-medium',    'en_US-ryan-medium',                  1.00, 1.00, 1.00),
  'Nishant':  ('hi_IN-rohan-medium',      'en_US-john-medium',                  1.00, 1.04, 1.02),
  'Mummy':    ('hi_IN-priyamvada-medium', 'en_GB-jenny_dioco-medium',           1.00, 1.00, 0.97),
  'Padosi':   ('hi_IN-pratham-medium',    'en_GB-northern_english_male-medium', 0.86, 0.95, 0.94),
  'Awaaz':    ('hi_IN-rohan-medium',      'en_GB-northern_english_male-medium', 0.78, 0.80, 0.86),
  'Dost':     ('hi_IN-rohan-medium',      'en_US-ryan-medium',                  0.92, 0.95, 1.00),
  'Ghar waala': ('hi_IN-pratham-medium',  'en_GB-northern_english_male-medium', 0.82, 0.90, 0.92),
  'Chacha':   ('hi_IN-pratham-medium',    'en_GB-northern_english_male-medium', 0.80, 0.88, 0.92),
  'Ajnabi':   ('hi_IN-rohan-medium',      'en_US-john-medium',                  0.88, 0.92, 0.94),
  'Chaiwala': ('hi_IN-rohan-medium',      'en_US-ryan-medium',                  0.90, 0.96, 1.0),
}
DEF = ('hi_IN-rohan-medium', 'en_US-ryan-medium', 1.0, 1.0, 1.0)
os.makedirs('public/voice/hi', exist_ok=True); os.makedirs('public/voice/en', exist_ok=True); os.makedirs('/tmp/vo', exist_ok=True)
def piper(model, text, out, length=1.0):
    v = _VOICES.get(model) or _VOICES.setdefault(model, PiperVoice.load(f'tools/models/{model}.onnx'))
    with wave.open(out, 'wb') as wf:
        v.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=length, noise_scale=0.6, noise_w_scale=0.7))
def post(wav, ogg, pitch, tempo, whisper, sr):
    f = []
    if abs(pitch - 1) > 0.01: f += [f'asetrate={int(sr*pitch)}', f'aresample={sr}', f'atempo={1/pitch:.4f}']
    if abs(tempo - 1) > 0.01: f += [f'atempo={tempo:.4f}']
    if whisper: f += ['highpass=f=420', 'lowpass=f=5200', 'volume=0.55', 'aecho=0.8:0.6:40:0.15']
    f += ['silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05', 'areverse', 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.08', 'areverse', 'loudnorm=I=-17:TP=-2:LRA=9', 'apad=pad_dur=0.12']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', ','.join(f), '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4', ogg], check=True)
def dur(ogg):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ogg]).decode().strip())
n = 0
for k, l in L.items():
    hm, em, ph, pe, tp = V.get(l['who'], DEF)
    whisper = bool(re.search(r'\((fusfusakar|whisper)', l['hi'], re.I)) or l['en'].lower().startswith('(whisper')
    for lang, model, text, pitch, length in (('hi', hm, dev(l['hi']), ph, 1.08), ('en', em, en_clean(l['en']), pe, 1.0)):
        ogg = f'public/voice/{lang}/{k}.ogg'
        if os.path.exists(ogg) and not FORCE:
            l['d_' + lang] = round(dur(ogg), 2); continue
        wav = f'/tmp/vo/{lang}_{k}.wav'
        try:
            piper(model, text, wav, length)
            post(wav, ogg, pitch, tp, whisper, 22050)
        except Exception as e:
            print('SKIP', k, lang, repr(text)[:60], str(e)[:80], flush=True)
            l.pop('d_' + lang, None); continue
        l['d_' + lang] = round(dur(ogg), 2); n += 1
        os.remove(wav)
    if n % 20 == 0: print(n, k, l['who'], flush=True)
json.dump(L, open('public/voice/lines.json', 'w'), ensure_ascii=False, indent=1)
print('rendered', n, 'clips; total', len(L), 'lines')
