---
layout: project
title: Giffuse
subtitle: Stitch Tumblr gifs + TikTok audio into an mp4 in browser
date: 2025-07-06
detail: false

# links
live_url: 
repo_url: 

# tech
stack: [React/TypeScript, Node/Express (fluent-ffmpeg), FastAPI (MoviePy)]

# meta
status: active
role: solo
tags: [tool, video, web]

# media (optional)
thumb: 
poster:
gif: /assets/gifs/giffuse.gif
---

a small personal drag & drop editing tool i'm building because i still haven't learned AfterEffects. 

<!--more-->

## problem
Tumblr’s native composer doesn’t handle external audio, and desktop tools add friction. I wanted a 100% in-browser way to align multiple GIFs to a short audio clip and export a shareable video.

## constraints
- must run client-side (privacy + zero install)
- source inputs are **animated GIFs** (variable FPS, weird timing)
- target output is **mp4** (so TikTok/IG accept it)
- trimming/splitting needs to feel instant

## approach
- decode GIFs with **ffmpeg.wasm**, extract frames + real durations
- snap track markers to the audio waveform (Web Audio API peaks)
- build a simple “timeline” model (JSON) that maps:
  - `clip -> startMs, endMs, playbackRate, offset`
- render with ffmpeg filtergraph:
  - scale/pad to 1080x1920
  - concat with explicit `-r` and `-vsync 2` to avoid dup frames
  - encode `libx264 -pix_fmt yuv420p -crf 23 -preset veryfast`

## demo
*(coming soon)*

## results
- typical 15s output exports in **~6–9s** on M2 MacBook Air
- audio stays in sync (±1 frame) across odd GIF timings
- no server costs, everything local

## lessons
- GIF frame durations lie; always normalize to exact ms
- doing layout in “timeline JSON” kept UI and export in sync
- ffmpeg.wasm memory spikes; reuse the same instance

## next
- draggable split points
- preset aspect ratios (1:1, 4:5, 9:16)
- shareable JSON project files
