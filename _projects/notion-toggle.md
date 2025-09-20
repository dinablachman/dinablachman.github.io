---
layout: project
title: Notion Toggle
subtitle: hide/show notion calendar sidebar
date: 2025-09-13
detail: true

# links
live_url: 
repo_url: https://github.com/dinablachman/notion-toggle

# tech
stack: [JavaScript, Chrome Extension API]

# meta
status: active
role: solo
tags: [tool, browser, productivity]

# media (optional)
thumb: /assets/notion-toggle/cover.jpg
poster: /assets/notion-toggle/demo-poster.jpg
gif: /assets/gifs/notion-toggle.gif
---
<br>

i love the Notion Calendar, but there is just one small UI detail i was tired of fixing manually!

<!--more-->

## problem

while the left sidebar is collapsible, notion has a fixed right sidebar that eats up space, especially when embedded on other sites. i wanted a lightweight way to hide/show it without manually dragging or clicking, especially in notion pages. i also wanted to choose between toggling w/keys and removing it altogether. 

## idea
the first thing i did was look up if anyone else had this problem. i came across a reddit thread in which a user shared a script that handles toggle in chrome console:

```js
document.addEventListener('keydown', function(event) {
    if (event.metaKey && event.key === '\\') {
        const currentWidth = getComputedStyle(document.documentElement)
                                .getPropertyValue("--context-panel-width").trim();
        if (currentWidth === "0px") {
            document.documentElement.style.setProperty("--context-panel-width", "250px"); // Change to desired width
        } else {
            document.documentElement.style.setProperty("--context-panel-width", "0px");
        }
    }
});
```

all we need to do is select the right element and set width to 0px. easy!

...except i'd need to enter this into the console on every page load. plus, i like to embed a mini 'day view' of my notion calendar into my notion itself, and this script doesn't work for the iframe embed. 

![my notion – before]({{ '/assets/images/notion-before.png' | relative_url }})

in the day view, i can't even see my schedule :( 

## process
i started with the snippet i found online, which taught me how to modify width in the page DOM on a certain hotkey. it also gave me the name (```--context-panel-width```) to look for.

i needed a chrome extension so that i could consistently store my preference of toggling the sidebar across browser sessions. first was my manifest.json, in which i specified the pages on which this would apply:

```json
"content_scripts": [
      {
        "matches": [
          "https://www.notion.so/*",
          "https://notion.so/*",
          "https://calendar.notion.so/*"
        ],
        "js": ["content.js"],
        "run_at": "document_idle",
        "all_frames": true
      }
    ]
```

i kept this in notion + notion calendar pages for now because notion calendar seems typically embedded within the notion workflow (i did some research into where else people tend to add the calendar, but didn't find another common use case yet).  
<br>

**iframe support**

notice the ```"all_frames": true```. this was the tiny piece that made the script work in embeds. notion embeds are just iframes, and this line tells the content script to run in the host site and all frames within it.

note that this is not the most ideal solution. i intentionally limited my ```matches``` so this script wouldn't unnecessarily run on unrelated sites, but if a matching site had many iframes, this might hurt performance (it doesn't differentiate across which frames to apply to). but as a personal tool, this is most straightforward, and i haven't noticed any changes in performance even on my content-heavy notion pages while having the extension active.

<br>

**keyboard & focus**

i capture the hotkey in a capture-phase keydown listener so it fires even when focus is inside the embed. i also guard against typing targets (```input```, ```textarea```, ```contentEditable```) so the shortcut doesn’t interfere with normal typing.

because different OSs handle modifier keys differently, the listener checks ```navigator.platform``` and routes ```cmd+/``` for mac and ```ctrl+/``` for others.

<br>

**persistence!**

without persistence, every page refresh or navigation resets the sidebar. that means if you hid it once, you’d have to re-toggle every single time. annoying. persistence makes the extension feel “native”. 

chrome extensions give you ```chrome.storage.local```, which is a little json blurb you can read/write to from any part of the extension (content script, popup, background worker).

so when you hit the hotkey, the content script flips the css variable width and also saves the new width into storage:

```js
chrome.storage.local.set({ sidebarWidth: next });
```

on load, the script calls ```chrome.storage.local.get``` and applies whatever value was last saved:

```js
chrome.storage.local.get('sidebarWidth', (res) => {
  if (res.sidebarWidth) setWidth(res.sidebarWidth);
});
```

this just means that the 'toggle' actually sticks. if you collapse the sidebar one day, it'll be collapsed the next day. a small detail that makes life easier.

<br>

**ui**

the popup is the little ui that opens when you click the extension icon in chrome. i used it for an on-off toggle for 'auto hide on load', and as a reminder of the hotkey command.

the ui is just a tiny html page with some minimal styling (i tried to keep the font + color scheme somewhat cohesive with notion), and ```popup.js``` changes the toggle based on the ```autoHide``` state.

<br>

## demo
<video controls muted playsinline style="width:100%;max-width:720px"> <source src="{{ '/assets/videos/notion-toggle-demo.mp4' | relative_url }}" type="video/mp4"> your browser does not support the video tag. </video>

<br>

## results + learning

this is just a tiny tool, but it has made using notion a bit more intuitive and easy. for example, now i can clearly see my *the summer i turned pretty* watch party coming up soon:

![my notion – after]({{ '/assets/images/notion-after.png' | relative_url }})

<br>

**limitations**
- when making an add-on tool, you're relying on somewhat limited knowledge of internal structure of the original site/app. if notion changes the element name, my script won't work.
- performance tradeoffs: setting ```"all_frames": true``` is a blanket fix that works for me but might be an issue for performance if a page has dozens of embeds. a more efficient pattern would be using the ```commands``` api + on-demand script injection (which i'm working on!)

<br>

**learning**

it is often the case that one minor UI annoyance for me turns into a side-quest project which takes up much more time than expected. i enjoyed the learning process, because the initial solution was dead-simple (change one css variable) but i ended up digging deep into edge case considerations (iframes, persistence, keyboard focus).

the biggest thing i learned was that simplicity is fine. i've actually been using this extension for a couple weeks now, and haven't noticed it - which is kind of the point of a little 'fix script'. it should do one task and do it well, so the user doesn't need to think about it. 

