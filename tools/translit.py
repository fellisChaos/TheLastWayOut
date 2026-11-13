"""Transliterate Roman-Hinglish story lines into Devanagari (for the Hindi Piper voices).
Uses the OpenAI-compatible proxy from the environment. Output: tools/lines_dev.json {id: devanagari}"""
import json, os, re, sys, urllib.request
L = json.load(open('public/voice/lines.json'))
extra = {
  "x_behind1": ("Awaaz", "Yahan kya kar rahe ho?"),
}
out_path = 'tools/lines_dev.json'
done = json.load(open(out_path)) if os.path.exists(out_path) else {}
base = os.environ['OPENAI_BASE_URL'].rstrip('/'); key = os.environ['OPENAI_API_KEY']
def clean(t): return re.sub(r'\([^)]*\)', '', t).strip()
todo = [(k, clean(v['hi'])) for k, v in L.items() if k not in done]
print(len(todo), 'to convert')
SYS = ("You convert Roman-script Hindi/Hinglish dialogue into natural Devanagari Hindi for a text-to-speech engine. "
       "Keep the words exactly as spoken (colloquial Hindi, English loanwords like 'torch', 'phone', 'scooter', 'helmet', 'signal', 'match' stay as Devanagari transliteration: टॉर्च, फ़ोन, स्कूटर, हेलमेट, सिग्नल, मैच). "
       "Keep punctuation (commas, ellipsis '...', ?, !) and convert to '।' only at real sentence ends of statements. Names: Nishan=निशान, Nishant=निशांत. "
       "Return ONLY a JSON object mapping each input id to its Devanagari string.")
for i in range(0, len(todo), 40):
    batch = dict(todo[i:i+40])
    body = json.dumps({"model": "gpt-5-mini", "messages": [{"role": "system", "content": SYS}, {"role": "user", "content": json.dumps(batch, ensure_ascii=False)}], "response_format": {"type": "json_object"}}).encode()
    req = urllib.request.Request(base + '/chat/completions', body, {"Content-Type": "application/json", "Authorization": "Bearer " + key})
    r = json.load(urllib.request.urlopen(req, timeout=300))
    got = json.loads(r['choices'][0]['message']['content'])
    for k in batch:
        if k in got and got[k].strip(): done[k] = got[k].strip()
    json.dump(done, open(out_path, 'w'), ensure_ascii=False, indent=1)
    print(i, len(done), flush=True)
missing = [k for k in L if k not in done]
print('missing', len(missing))
