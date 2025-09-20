---
layout: project
title: Did They Eat That?
subtitle: real vs. AI video detection game w/ Veo 3
date: 2025-09-17
detail: true

# links
live_url: 
repo_url:

# tech
stack: React, TypeScript, Vite, Tailwind, Web Share API

# meta
status: active
role: solo
tags: [game, ai, video, web, frontend, retro]

# media (optional)
thumb: 
poster: 
gif: /assets/gifs/ai-game.gif
---

has your TikTok timeline been taken over by these real vs. AI guessing games, and are you also a bit concerned about your score on them?

<!--more-->

## context


the videos go like this: a real clip and an AI-generated clip (seemingly Veo 3, due to the uptick of these videos since its release) are shown side by side. you are given a couple of seconds to decide which is which, before the right answer is revealed.

<br>

<div style="display:flex; flex-wrap:nowrap; gap:12px; overflow-x:auto; align-items:flex-start;">
<video controls muted playsinline style="flex:0 0 auto; max-width:220px;">
  <source src="{{ '/assets/videos/ai-tiktok1.MP4' | relative_url }}" type="video/mp4">
  your browser does not support the video tag.
</video>
<video controls muted playsinline style="flex:0 0 auto; max-width:220px;">
  <source src="{{ '/assets/videos/ai-tiktok2.MP4' | relative_url }}" type="video/mp4">
  your browser does not support the video tag.
</video>
<video controls muted playsinline style="flex:0 0 auto; max-width:220px;">
  <source src="{{ '/assets/videos/ai-tiktok3.MP4' | relative_url }}" type="video/mp4">
  your browser does not support the video tag.
</video>
</div>

<br>

i think by now we've picked up on some of the AI 'tells' like disappearing objects, missing fingers, and the distinct smoothness of generated videos. but something about the simultaneous side-by-side and the time limit makes it genuinely hard to notice AI content at times. the comments agree:

<div style="display:flex; flex-wrap:nowrap; gap:12px; overflow-x:auto; align-items:flex-start;">
  <img src="{{ '/assets/images/screenshot1.jpg' | relative_url }}" alt="comments section" style="flex:0 0 auto; width:min(220px,28vw); height:min(220px,28vw); object-fit:contain; background:#000;">
  <img src="{{ '/assets/images/screenshot2.jpg' | relative_url }}" alt="comments section" style="flex:0 0 auto; width:min(220px,28vw); height:min(220px,28vw); object-fit:contain; background:#000;">
</div>

<br>

this seems to be a response to the fact that AI clips on TikTok are currently blowing up. right now, high-quality AI video is limited to about 8 seconds, which translates perfectly to the attention span of TikTok audiences.

one niche of these short AI clips is extremely popular right now: mukbangs. the people yearn for mukbangers who can defy human limitations and eat lava, or gems on toast, or glass fruits. this is a market that human mukbangers cannot compete in, unfortunately. 

beyond watching AI *eat* food, TikTok users seem to love watching AI *make* food. and while some of these clips are too outlandish to be mistaken for reality, some are genuinely realistic. 

i have fun watching these videos too, but it's also worth mentioning that as AI gets better at video generation, people who might not be as technologically literate may have a hard time distinguishing between real and fake content. it's not necessarily a risk when it comes to AI mukbangs, but it might be when AI is used to generate anywhere from scam calls to celebrity deepfakes to political misinformation.

with all that being said, i don't expect to tackle the entire topic of AI literacy with a simple web game. but my idea is that gamifying the process of AI content detection could spread some awareness of the current capabilities of multimodal models, while keeping users' skills sharp so they're less prone to being misled. and as the popularity of the real vs. AI TikToks shows, it's also just fun!

in the spirit of this, i wanted to make the AI detection game food-focused. in other words, 'did they eat that?'.

<br>

## data collection

i don't have any background information on how TikTok creators make these side-by-side AI game videos, as they don't specify any model publicly. but as previously mentioned... i'm pretty sure they're using the Veo model.

what's most important to replicate this is the dataset for both sets of videos. coding the time limit and answer feedback element is straightforward once data is organized into real vs. AI clips, but i was stuck on a data source.

thankfully, the internet has a considerable corpus of real video clips of just about anything. a good amount of it is completely free-to-use. i found [pexels.com]() as a great resource because it is high-quality, specific, and searchable.

getting a corpus of AI-generated clips, however, is much more of a challenge. the problem is twofold: 

1. multimodal ai capabilities (specifically video) improve very, very quickly.
2. video generation is expensive.

this means that any existing AI-generated video dataset i could find was outdated and, by current standards, clearly not real. my best bet for gathering videos from a more recent model was directly generating the videos myself.

unfortunately, i am a college student. Veo 3 is $0.40 per second, and Veo 3 Fast is $0.15 per second. for other models, both the subscription and credit plans are out of my budget.

luckily, i get Google AI Pro as a student, which comes with some credits, and that's what i'm using!

<br>

**matching AI/real clips**

a key component of these real vs. AI challenges is that the content / subject of the clips is almost identical. both are something mundane, like someone eating a burger, which makes it harder to spot clear AI tells. 

so i needed to not only collect both datasets, but make sure they matched one-to-one. since i can only really 'prompt' one model for precise details vs. searching for a matching real clip, i needed to collect real videos first and then generate corresponding AI clips based on that content.

it makes sense to automate this process in some way through a pipeline: collect a batch of real clips, prompt a model to extract relevant information in those clips + output prompts for Veo 3 to generate, then batch output the AI clips within Veo 3.

i'm still working on this, because unfortunately (free) LLMs on the market are not yet strong at parsing and understanding videos. there's also a bottleneck on batch generation with Veo 3 due to usage limits.

for now, i do this manually: find clips, create prompts for Veo 3, and generate one at a time. then i assign pairs in both datasets numerically so that it's easier to match them in my code. 

<br>

## building the game

once i had my initial dataset of paired clips, the rest of the app was 'just' front-end work. i wanted to keep it lightweight and intuitive to play, but also have a retro feel. i love the aesthetics of the old terminal and 80s arcade games, and i love pastel color palettes, so i tried to combine that into a cohesive UI (still in progress).

<br>

**stack & setup**

i used React + TypeScript with Vite because it was easiest to iteratively build and test live in my browser. i went with Tailwind for styling because honestly raw CSS for the pixel borders and drop-shadows would have been a lot, and i wanted a working demo up quickly. the app runs entirely client-side right now.

<br>

**game flow**

the logic is pretty straightforward:

1. the app auto-discovers how many video pairs exist. it checks in the directories ```/real/``` and ```/fake/```, each containing numbered mp4 files. (```real/1.mp4``` matches ```fake/1.mp4```, etc.)
2. for each round, it randomly assigns the real video to one side and the AI video to another.
3. the user has 7 seconds to select the AI clip. they can change their selection until the timer runs out, or click 'reveal' to skip the timer.
4. after revealing, the user gets instant feedback on both their accuracy *and* which clip is real/AI. more on this in 'ui choices'.

when all rounds are done, the user sees their stats: total score, accuracy, and highest streak. i also added a little confetti animation.

<br>

**ui choices**

this is my first time building a proper *game* from scratch. what i didn't realize before starting is how intentional you need to be with your UI/UX choices to actually make the game intuitive and fun to play, even for a dead simple click game. 

for example - in the TikTok videos i took inspiration from, text overlays of 'AI' and 'real' would pop up across each video after a few seconds. when making that process interactive, i needed to think about what kind of instant visual feedback would make sense to (a) make it clear whether the user is right or wrong and (b) make it clear which video is AI. the two end up overlapping in confusing ways.

when the two choices are either 'real' or 'fake', it *feels* like visual cues are necessary to reveal which is which. something like a green border or popup on the real side, and the same in red on the AI side, feels in line with our associations of real/fake. 

simultaneously, the user needs feedback on whether their *answer*, specifically, is right or wrong. i initially tried to add feedback through a text popup, but it was easy to miss, especially for a game that prioritizes quick clicks. it also clashed with the real/fake reveal (users might assume that the red border means their answer is wrong).

what i settled on, for now, is this:

accuracy feedback - green vs. red border on reveal. the user sees one color on submit, and can intuitively feel whether they are right or wrong before reading text.

AI reveal - large white text overlays. this aligns with the format of similar TikToks, and it is easy to scan while not conflicting with the accuracy feedback.

<br>

## demo

<video controls muted playsinline style="width:100%;max-width:720px"> <source src="{{ '/assets/videos/ai-game-demo_same-size.mp4' | relative_url }}" type="video/mp4"> your browser does not support the video tag. </video>

<br>

## challenges so far

1. the biggest bottleneck right now is the speed at which i can gather a dataset. i have 3 pairs as of now so i can demonstrate gameplay, but of course an enjoyable game would have 10-100x that. to fix this, i'm working on the automation process i mentioned before.
2. video validation + loading: even loading 6 8-second clips can feel a bit laggy with my current logic and setup. as i add to the dataset, i'll need to optimize video loads (either pre-loading everything with a load screen before start or mini-batching during gameplay).

<br>

## my to-do + next steps

my #1 priority is populating my dataset. it's very important to me that the video clips are genuinely high quality (generated by a recent, advanced model) because using outdated clips of AI would defeat much of my purpose behind the game.

#2 is almost as important: making the game shareable and replayable. this means (after adding more data) randomizing clip order and creating a better results graphic to share to social media. i'm working on using the web share api with custom graphics/text/etc.

more cool features to implement: better UI details to make the game feel truly retro, custom timers, competitions/rankings, and more i'll think of.

i'm super excited to keep working on this, and i hope i can share it with my friends soon!