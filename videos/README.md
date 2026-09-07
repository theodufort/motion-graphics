# videos/ — narrated multi-graphic videos

Compose a full YouTube-ready video from several motion graphics. Each segment
is one graphic rendered frame-by-frame in headless chromium, narrated with
[Piper](https://github.com/OHF-Voice/piper) (local, offline TTS), and the
segments are joined with crossfades.

Everything is local: no cloud, no network except the one-time Piper voice
download.

## Render a storyboard

```sh
# from the repo root
node tool/makevideo.mjs videos/<name>.storyboard.json
# or via npm script
(cd tool && npm run makevideo -- ../videos/<name>.storyboard.json)
```

Output goes to `videos/<title>.mp4` (overridable with `"output"` in the
storyboard). Intermediates (source frames, per-segment clips) live under
`tool/shots/_video/` and are gitignored.

## Storyboard schema

```jsonc
{
  "title": "security-fundamentals-demo",   // output slug; default: file name
  "fps": 30,                               // default 30
  "width": 1920,                           // default 1920 (must be even)
  "height": 1080,                          // default 1080 (must be even)
  "crossfade": 500,                        // ms crossfade between segments; default 500, 0 = hard cut
  "voice": "en_US-lessac-medium",          // Piper voice name; default en_US-lessac-medium
  "output": "videos/my-video.mp4",         // optional output path override
  "segments": [
    // Audio source — first present field wins:
    { "graphic": "pgsodium-salted-hashing", "narration": "Pgsodium salts each password…" },
    { "graphic": "kafka-exactly-once-path", "audio": "path/to/prem/wav", "duration": 6000 },
    { "graphic": "js-event-loop", "duration": 5000 }
  ]
}
```

**Segment rules**

- `graphic` — a graphic folder name (relative to repo root) or a path to an
  `index.html`. The graphic must expose `window.__time(ms)` (all graphics in
  this repo do).
- `narration` — text spoken by Piper. The segment's length is the rendered
  audio length (+ a small tail).
- `audio` — path to an existing audio file (WAV/MP3/etc.), used verbatim.
  Pair with `duration` if you want the visual to run longer/shorter than the
  audio.
- `duration` — milliseconds. Overrides the rendered length. When there is no
  `narration` and no `audio`, this is the length of a silent segment
  (defaults to 4000 ms).
- A single source's audio wins over `duration` unless `duration` is also
  present, in which case `duration` wins and the audio is looped/padded to it.

**Final duration** = Σ(segment lengths) − (N − 1)·crossfade.

## Performance

Render time scales with total frame count (Σ duration × fps). The 720p/24fps
smoke test (~39 s of video) renders in roughly 2–4 minutes on a modern
laptop. 1080p/30fps is ~2.25× the frame count of 720p/24fps for the same
runtime, so plan accordingly. Each segment renders one chromium instance, so
memory is bounded by the largest single graphic.

## Caching

The three expensive stages are **content-keyed and cached** in
`tool/shots/_video/`, so iterating on a storyboard is fast:

- **TTS** — re-runs only when the narration text or voice changes.
- **Frame render** — re-runs only when the graphic's `index.html` content,
  its rendered duration, fps, or target width changes.
- **Per-segment clip encode** — re-runs only when its frames or audio
  changed (or the duration/fps/resolution did).

The final crossfade assembly always re-runs (it's cheap). On a re-run with
nothing changed, only the assembly happens.

To force a full clean re-render, set `MG_NO_CACHE=1` (or delete
`tool/shots/_video/`).

## Environment knobs

| Var              | Effect                                                              |
| ---------------- | ------------------------------------------------------------------- |
| `MG_PYTHON`      | Python interpreter that has `piper` (auto-detected otherwise)       |
| `MG_VOICE_MODEL` | Absolute path to a `.onnx` voice (skips the `tool/voices/` lookup)  |
| `MG_FFMPEG`      | Override the `ffmpeg` binary                                        |
| `MG_FFPROBE`     | Override the `ffprobe` binary                                       |
| `MG_WORK_ROOT`   | Intermediates directory (default `tool/shots/_video`)               |
| `MG_MAX_FRAMES`  | Safety cap on frames per segment (default 2400 = 80 s @ 30 fps)     |
| `MG_NO_CACHE`    | Set to `1` to ignore the cache and force a full re-render           |

## Installation (one-time)

```sh
# 1. Python TTS — install Piper into the same interpreter you'll use
pip install piper-tts

# 2. The voice — downloaded automatically on first run into tool/voices/, or:
python -m piper.download_voices en_US-lessac-medium --download-dir tool/voices

# 3. Chromium headless — already a dependency of playwright (used by validate.mjs)
(cd tool && npm install)

# 4. ffmpeg — any modern build (scoop/winget/homebrew)
# On Windows:  winget install ffmpeg     (or: scoop install ffmpeg)
```

Piper voice list: see `python -m piper.download_voices --help`, or
<https://rhasspy.github.io/piper-samples/voices/lessac/lessac-medium.html>.

## Files

- `smoke.json` — minimal 2-segment example (720p, 24 fps), used to smoke-test
  the pipeline.
- `security-fundamentals.storyboard.json` — a real 1080p storyboard covering
  three security topics (password hashing, JWT verification, Kafka
  exactly-once).
