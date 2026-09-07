#!/usr/bin/env node
// makevideo.mjs — assemble a YouTube-ready video from multiple motion graphics,
// each narrated (Piper TTS or bring-your-own audio), with crossfades between
// segments. Fully local: headless chromium (playwright) renders frames, piper
// generates speech, and ffmpeg encodes + crossfades + muxes.
//
// CLI:
//   node makevideo.mjs <storyboard.json> [options]
//
// storyboard.json:
//   {
//     "fps": 30, "width": 1920, "height": 1080, "crossfade": 500,
//     "voice": "en_US-lessac-medium",
//     "output": "videos/my-video.mp4",        // optional override
//     "title": "My Video",                    // optional, shown in logs
//     "segments": [
//       { "graphic": "pgsodium-salted-hashing", "narration": "Pgsodium salts…" },
//       { "graphic": "kafka-exactly-once-path", "audio": "path/to/wav", "duration": 6000 },
//       { "graphic": "js-event-loop",           "duration": 5000 }
//     ]
//   }
//
// Per-segment source of audio (first that is present wins):
//   - narration : string  → Piper TTS (voice model, or MG_VOICE_MODEL=path)
//   - audio     : string  → path to an existing audio file (used as-is)
//   - (none)    :         → silent, duration = segment.duration || 4000 ms
// "duration" (ms) overrides the rendered length (defaults to the audio length).
//
// Env knobs:
//   MG_PYTHON     python interpreter that has piper (default: auto-detect)
//   MG_VOICE_MODEL absolute path to a .onnx voice (skips tool/voices lookup)
//   MG_FFMPEG / MG_FFPROBE  override ffmpeg/ffprobe binaries
//   MG_WORK_ROOT  where intermediates live (default: tool/shots/_video)
//
import { chromium } from "playwright";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";

const pexecFile = promisify(execFile);
const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));      // .../motion-graphics/tool
const ROOT = path.resolve(TOOL_DIR, "..");                                        // .../motion-graphics
const VOICE_DIR = path.join(TOOL_DIR, "voices");
const DEFAULT_WORK = path.join(TOOL_DIR, "shots", "_video");

const FFMPEG = process.env.MG_FFMPEG || "ffmpeg";
const FFPROBE = process.env.MG_FFPROBE || "ffprobe";

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
function log(...a) { console.log(...a); }
function fail(msg) { console.error(`\n✗ makevideo: ${msg}`); process.exit(1); }

function run(bin, args, opts = {}) {
  return pexecFile(bin, args, {
    cwd: opts.cwd,
    maxBuffer: 1 << 28,
    input: opts.input,           // optional stdin string
    encoding: "utf8",
  }).catch((e) => {
    const stdout = e.stdout || ""; const stderr = e.stderr || "";
    throw new Error(`${path.basename(bin)} failed (${e.code ?? "unknown"}):\n${(stderr + stdout).trim().slice(-2000)}`);
  });
}

// ---- content-keyed caching --------------------------------------------------
// Each expensive stage (TTS, frame render, per-segment encode) writes a tiny
// meta JSON next to its output. On re-runs we skip the stage when the meta
// still matches the current inputs AND the output is present + newer than the
// inputs. This makes iteration fast (TTS only re-runs when voice/narration
// change; chromium re-runs only when duration/fps/width/graphic change; the
// encode re-runs only when either input changed) without touching any user
// facing behavior. Bypass with MG_NO_CACHE=1.
function hashOf(...parts) {
  return createHash("sha1").update(parts.join("\u0001")).digest("hex").slice(0, 16);
}
const CACHE_ENABLED = !process.env.MG_NO_CACHE;
function readMeta(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return null; }
}
function writeMeta(file, obj) {
  writeFileSync(file, JSON.stringify(obj));
}
function isStale(out, metaFile, expectedMeta) {
  if (!CACHE_ENABLED) return true;
  if (!existsSync(out) || !existsSync(metaFile)) return true;
  const m = readMeta(metaFile);
  if (!m || m.h !== expectedMeta.h) return true;
  return false;
}

function fileSig(p) {
  if (!existsSync(p)) return { mtime: 0, size: 0 };
  const st = statSync(p);
  return { mtime: Math.round(st.mtimeMs), size: st.size };
}

async function ffprobeDuration(file) {
  const { stdout } = await run(FFPROBE, [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  const n = parseFloat(stdout.trim());
  if (!Number.isFinite(n) || n <= 0) throw new Error(`could not read duration of ${file}`);
  return n; // seconds
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Python / Piper discovery (cache the working interpreter)
// ---------------------------------------------------------------------------
const PY_CANDIDATES = [
  process.env.MG_PYTHON,
  "C:/Users/admin/.PYENV/PYENV-WIN/versions/3.13.7/python.exe",
  "python", "python3", "py",
].filter(Boolean);

let _py = null;
async function findPython() {
  if (_py) return _py;
  for (const p of PY_CANDIDATES) {
    try {
      await run(p, ["-c", "import piper  # noqa"]);
      _py = p; return p;
    } catch { /* try next */ }
  }
  fail("no python with `piper` found — set MG_PYTHON to your python that ran `pip install piper-tts`");
}

async function resolveVoiceModel(voiceName) {
  if (process.env.MG_VOICE_MODEL) return process.env.MG_VOICE_MODEL;
  const p = path.join(VOICE_DIR, `${voiceName}.onnx`);
  if (existsSync(p)) return p;
  // try to download it
  log(`  voice ${voiceName} not in ${VOICE_DIR}; attempting download…`);
  const py = await findPython();
  mkdirSync(VOICE_DIR, { recursive: true });
  await run(py, ["-m", "piper.download_voices", voiceName, "--download-dir", VOICE_DIR]);
  if (!existsSync(p)) fail(`voice model ${p} missing after download attempt`);
  return p;
}

async function ttsToWav(text, outWav, voiceName) {
  const py = await findPython();
  const model = await resolveVoiceModel(voiceName);
  // write text to a sidecar and use piper's -i (avoids stdin-buffering quirks)
  const txt = outWav.replace(/\.wav$/i, ".txt");
  writeFileSync(txt, text, { encoding: "utf8" });
  await run(py, ["-m", "piper", "-m", model, "-i", txt, "-f", outWav]);
  if (!existsSync(outWav)) throw new Error(`piper did not write ${outWav}`);
}

function slugify(s) {
  return (s || "video").toString().replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "video";
}

// ---------------------------------------------------------------------------
// frame renderer — seeks window.__time and screenshots the canvas, reusing the
// exact protocol validate.mjs relies on (seek sticks; the standing rAF loops).
// The canvas self-sizes to W = min(innerWidth-32, 1100), H = W*9/16, so we
// target a full-bleed frame by rendering at CSS width 1100 (viewport 1132) and
// scaling the screenshot by (targetW / 1100).
// ---------------------------------------------------------------------------
const CANVAS_CSS_W = 1100;
const VIEWPORT_W = CANVAS_CSS_W + 32;

async function renderSegmentFrames({ page, htmlPath, frameMs, frames, dir, scale }) {
  // one page per segment keeps state clean and lets us run segments in order
  // (chromium per-file load is fast enough for typical storyboards)
  await page.goto("file://" + htmlPath.replace(/\\/g, "/"), {
    waitUntil: "load", timeout: 15000,
  });
  const hasSeek = await page.evaluate(() => typeof window.__time === "function").catch(() => false);
  if (!hasSeek) throw new Error(`${htmlPath} does not expose window.__time (required for video)`);
  await page.waitForTimeout(200); // let fonts/layout settle

  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ timeout: 10000 });

  for (let i = 0; i < frames; i++) {
    const seekMs = i * frameMs;
    await page.evaluate((t) => { window.__time(t); }, seekMs);
    // wait two rAFs so the standing loop has redrawn at the seek position
    await page.evaluate(() =>
      new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
    ).catch(() => {});
    await canvas.screenshot({ path: path.join(dir, `frame_${String(i).padStart(5, "0")}.png`) });
  }
  return frames;
}

async function renderVideoSegment({ name, htmlPath, durationMs, fps, width, height, workRoot, onFrame }) {
  const scale = width / CANVAS_CSS_W;
  const dir = path.join(workRoot, name);
  mkdirSync(dir, { recursive: true });
  // safety cap so a bad duration can't spawn thousands of PNGs
  const maxFrames = Number(process.env.MG_MAX_FRAMES) ?? 2400; // =80s @30fps
  const rawFrames = Math.ceil((durationMs / 1000) * fps);
  if (rawFrames > maxFrames) throw new Error(
    `segment too long: ${rawFrames} frames > MG_MAX_FRAMES=${maxFrames} (durationMs=${durationMs}); pass a shorter duration`);
  const frames = Math.max(1, rawFrames);
  const frameMs = (durationMs / 1000) / frames;

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: VIEWPORT_W, height: Math.ceil(CANVAS_CSS_W * 9 / 16) + 4 },
    deviceScaleFactor: scale,
  });
  try {
    await renderSegmentFrames({ page, htmlPath, frameMs, frames, dir, scale });
    if (onFrame) onFrame(frames, dir);
    return { dir, frames };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// storyboard
// ---------------------------------------------------------------------------
function normalizeNumber(n, key) {
  if (n === undefined || n === null || n === "") return undefined;
  const v = Number(n);
  if (!Number.isFinite(v)) fail(`${key} must be a number, got ${JSON.stringify(n)}`);
  return v;
}

function loadStoryboard(file) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(raw.segments) || raw.segments.length === 0)
    fail(`${file} must have a non-empty "segments" array`);
  const sb = {
    title: raw.title || path.basename(file).replace(/\.(json|storyboard\.json)$/i, ""),
    fps: normalizeNumber(raw.fps, "fps") || 30,
    width: normalizeNumber(raw.width, "width") || 1920,
    height: normalizeNumber(raw.height, "height") || 1080,
    crossfade: Math.max(0, normalizeNumber(raw.crossfade, "crossfade") ?? 500), // ms; default 500
    voice: raw.voice || "en_US-lessac-medium",
    output: raw.output,
    segments: raw.segments,
  };
  if (sb.fps < 1 || sb.fps > 120) fail(`fps out of range (1-120): ${sb.fps}`);
  return sb;
}

function resolveGraphic(graphic, workRoot) {
  const g = path.resolve(graphic);
  const htmlPath = existsSync(path.join(g, "index.html")) ? path.join(g, "index.html")
    : existsSync(g) && g.endsWith(".html") ? g : null;
  if (!htmlPath) fail(`segment "graphic" does not resolve to a graphic folder: ${graphic}`);
  return htmlPath;
}

// ---------------------------------------------------------------------------
// ffmpeg: build one per-segment clip (video+audio, both exactly `dur`)
// ---------------------------------------------------------------------------
// force frames to the exact target WxH (even, 16:9) — the canvas's native
// pixel size varies per graphic and can be odd, which libx264 rejects.
function videoFilter(width, height) {
  const w = Math.max(2, width - (width % 2));
  const h = Math.max(2, height - (height % 2));
  return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x090909,format=yuv420p`;
}

async function encodeSegmentClip({ framesDir, audioFile, dur, fps, width, height, outMp4 }) {
  // audio: use real file (looped/padded) OR a silent track of exactly dur
  let audioArgs;
  if (audioFile) {
    audioArgs = ["-stream_loop", "-1", "-i", audioFile];
  } else {
    audioArgs = ["-f", "lavfi", "-t", String(dur), "-i", `anullsrc=r=22050:cl=mono`];
  }
  const args = [
    "-y",
    "-framerate", String(fps),
    "-i", path.join(framesDir, "frame_%05d.png"),
    ...audioArgs,
    "-t", String(dur),
    "-map", "0:0", "-map", "1:0",
    "-vf", videoFilter(width, height),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(fps), "-crf", "18", "-preset", "fast",
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
    "-movflags", "+faststart",
    outMp4,
  ];
  await run(FFMPEG, args);
}

// ---------------------------------------------------------------------------
// ffmpeg: crossfade-concat N clips (video xfade + audio acrossfade)
// ---------------------------------------------------------------------------
function buildCrossfadeCommand(clips, durations, C, outMp4) {
  const n = clips.length;
  const inputs = [];
  for (const c of clips) inputs.push("-i", c);

  // video: chained xfade. clip i joins the running sequence at
  // offset = sum(dur[0..i-1]) - i*C   (each join starts C before the end
  // of the accumulated sequence so far). acc = accumulated duration after
  // joining clips up through i-1.
  // xfade offset for joining clip i onto the accumulated sequence =
  // (length of accumulated so far) - C. `prefix` is that accumulated length
  // and is already reduced by C on each prior join, so we only subtract one C.
  let prefix = durations[0];
  let prev = "0:v";
  const vparts = [];
  for (let i = 1; i < n; i++) {
    const offset = prefix - C;
    const tag = i === n - 1 ? "vout" : `vx${i}`;
    vparts.push(`[${prev}][${i}:v]xfade=transition=fade:duration=${C.toFixed(3)}:offset=${offset.toFixed(3)}[${tag}]`);
    prefix = prefix + durations[i] - C;   // update for next join
    prev = tag;
  }
  // audio: chained acrossfade — auto-overlaps by C, stays aligned with video.
  let prevA = "0:a";
  const aparts = [];
  for (let i = 1; i < n; i++) {
    const tag = i === n - 1 ? "aout" : `ax${i}`;
    aparts.push(`[${prevA}][${i}:a]acrossfade=d=${C.toFixed(3)}[${tag}]`);
    prevA = tag;
  }

  const filter = [...vparts, ...aparts].join(";");
  return {
    args: [
      "-y", ...inputs,
      "-filter_complex", filter,
      "-map", "[vout]", "-map", "[aout]",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "fast",
      "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
      "-movflags", "+faststart", outMp4,
    ],
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function usage() {
  return readFileSync(new URL("./makevideo.mjs", import.meta.url), "utf8")
    .split("\n").slice(0, 34).join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv[0];
  if (!file || argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    process.exit(file ? 0 : 1);
  }
  const sb = loadStoryboard(path.resolve(file));
  const slug = slugify(sb.title);
  const workRoot = process.env.MG_WORK_ROOT || DEFAULT_WORK;
  const outName = path.join(workRoot, slug);
  const finalOut = sb.output ? path.resolve(sb.output) : path.join(ROOT, "videos", `${slug}.mp4`);
  const fps = sb.fps, width = sb.width, height = sb.height;
  const C = sb.crossfade / 1000; // seconds

  log(`\n▶ makevideo: ${sb.title}`);
  log(`  ${sb.segments.length} segment(s) · ${width}×${height} @ ${fps}fps · crossfade ${sb.crossfade}ms · voice ${sb.voice}`);
  log(`  out: ${finalOut}\n`);

  const clips = [];
  const durations = [];

  for (let i = 0; i < sb.segments.length; i++) {
    const seg = sb.segments[i];
    const t0 = Date.now();
    const name = `seg_${String(i).padStart(2, "0")}_${seg.graphic}`;
    log(`[${i + 1}/${sb.segments.length}] ${seg.graphic}`);

    // 1) audio
    let audioFile = null;
    let durMs;
    const segAudioDir = path.join(workRoot, name);
    mkdirSync(segAudioDir, { recursive: true });
    if (typeof seg.narration === "string" && seg.narration.trim()) {
      audioFile = path.join(segAudioDir, `${name}.wav`);
      const wavMeta = path.join(segAudioDir, `${name}.wav.meta`);
      const tkey = hashOf("tts", sb.voice, seg.narration.trim());
      if (!isStale(audioFile, wavMeta, { h: tkey })) {
        log(`  · tts cached (${seg.narration.length} chars)`);
      } else {
        log(`  · tts (${seg.narration.length} chars)`);
        await ttsToWav(seg.narration.trim(), audioFile, sb.voice);
        writeMeta(wavMeta, { h: tkey });
      }
      const ad = await ffprobeDuration(audioFile);
      durMs = seg.duration ?? Math.round(ad * 1000);
    } else if (seg.audio) {
      audioFile = path.resolve(seg.audio);
      if (!existsSync(audioFile)) fail(`segment ${i} audio file missing: ${audioFile}`);
      const ad = await ffprobeDuration(audioFile);
      durMs = seg.duration ?? Math.round(ad * 1000);
      log(`  · audio ${path.basename(audioFile)} (${ad.toFixed(2)}s)`);
    } else {
      durMs = seg.duration ?? 4000;
      log(`  · silent (${(durMs / 1000).toFixed(2)}s default)`);
    }

    // add a small tail so narration isn't cut mid-word at the crossfade edge
    const tailMs = (typeof seg.narration === "string" && seg.narration.trim()) ? 250 : 100;
    durMs += tailMs;

    // 2) frames
    const htmlPath = resolveGraphic(seg.graphic, workRoot);
    const framesDir = path.join(workRoot, name);
    const expectedFrames = Math.max(1, Math.ceil((durMs / 1000) * fps));
    const lastFrame = path.join(framesDir, `frame_${String(expectedFrames - 1).padStart(5, "0")}.png`);
    const framesMeta = path.join(framesDir, "frames.meta");
    const fkey = hashOf("frames", fileSig(htmlPath).mtime, fileSig(htmlPath).size,
      String(durMs), String(fps), String(width), Math.ceil((durMs / 1000) * fps));
    if (!isStale(lastFrame, framesMeta, { h: fkey })) {
      log(`  · frames cached (${expectedFrames} frames)`);
    } else {
      await renderVideoSegment({
        name, htmlPath, durationMs: durMs, fps, width, height, workRoot,
        onFrame: (frames, d) => log(`  · ${frames} frames @ ${fps}fps → ${d}`),
      });
      writeMeta(framesMeta, { h: fkey });
    }

    // 3) segment clip (video+audio, exactly dur)
    const outMp4 = path.join(segAudioDir, `${name}.mp4`);
    const clipMeta = path.join(segAudioDir, `${name}.mp4.meta`);
    const ckey = hashOf("clip", fkey,
      audioFile ? fileSig(audioFile).mtime : "none", audioFile ? fileSig(audioFile).size : 0,
      String(durMs), String(fps), String(width), String(height));
    if (!isStale(outMp4, clipMeta, { h: ckey })) {
      log(`  · clip cached`);
    } else {
      await encodeSegmentClip({ framesDir, audioFile, dur: durMs / 1000, fps, width, height, outMp4 });
      writeMeta(clipMeta, { h: ckey });
    }
    const dur = await ffprobeDuration(outMp4);
    clips.push(outMp4);
    durations.push(dur);
    log(`  ✓ clip ${dur.toFixed(2)}s  (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);
  }

  // clamp crossfade so it never exceeds half of any clip
  const minClip = Math.min(...durations);
  const Ceff = Math.min(C, minClip / 2);
  if (Ceff === 0) {
    // no crossfade possible → simple concat
    log("\n⚠ crossfade clamped to 0 (clip too short); doing hard-cut concat");
  }

  mkdirSync(path.dirname(finalOut), { recursive: true });
  log(`\n▶ assembling ${clips.length} clip(s) …`);
  let finalCmd;
  if (clips.length === 1 || Ceff <= 0.001) {
    const listDir = path.join(workRoot, "_concat");
    mkdirSync(listDir, { recursive: true });
    const listFile = path.join(listDir, `${slug}.txt`);
    writeFileSync(listFile, clips.map((c) => `file '${c.replace(/\\/g, "/")}'`).join("\n"));
    finalCmd = { args: ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", finalOut] };
  } else {
    finalCmd = buildCrossfadeCommand(clips, durations, Ceff, finalOut);
  }
  await run(FFMPEG, finalCmd.args);

  const finalDur = await ffprobeDuration(finalOut);
  const size = (statSync(finalOut).size / 1024 / 1024).toFixed(2);
  log(`\n✓ DONE → ${finalOut}`);
  log(`  ${finalDur.toFixed(2)}s · ${size} MB · ${width}×${height}@${fps}fps`);
  log(`  (intermediates in ${outName}/)\n`);
}

main().catch((e) => fail(e.message || String(e)));
