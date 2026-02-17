### ORBITAL SWING
ORBITAL SWING is a high-performance, physics-based swinging platformer inspired by Stickman Hook. Built with React and Matter.js, it features momentum-driven gameplay, a robust built-in Level Editor, and procedural generation, all running locally in the browser with zero external dependencies or AI APIs.

![alt text](https://img.shields.io/badge/Physics-Matter.js-blueviolet)

![alt text](https://img.shields.io/badge/Feature-Level%20Editor-cyan)

![alt text](https://img.shields.io/badge/Storage-Local-green)

![alt text](https://img.shields.io/badge/AI-None-orange)


### Features
- Momentum Physics: Swinging mechanics using Matter.js constraints, allowing for complex maneuvers and high speed traversal.
- Integrated Level Editor: A full featured section to build your own sectors.
- Tools: Place anchors, solid walls, lethal hazards, and boost pads.
- Auto-Generate: Instantly create new layouts using a local procedural algorithm.
- Live Testing: Seamlessly switch between editing and playing.
- Level Sharing: Publish your custom sectors to friends via a single URL (Level data is Base64 encoded directly into the query string).
- Procedural Content: 10+ built-in sectors that scale in difficulty, plus the ability to expand the map infinitely.
- Synthesized Audio: Dynamic sound effects generated in real-time using the Web Audio API—no heavy MP3 files required.
- Zero-API Architecture: Everything runs 100% locally. No API keys, no internet connection required after initial load.

## Controls

| Action          | Input                     |
|-----------------|---------------------------|
| Hook / Swing    | `Space` or `Left Click`   |
| Release         | `Release Space` or `Release Click` |
| Restart Sector  | `R` or UI Button          |
| Pan (Editor)    | `Right Click + Drag`      |

Technical Stack
- Frontend: React (Functional Components + Hooks)
- Physics Engine: Matter.js
- Styling: Tailwind CSS
- Icons: FontAwesome
- Audio: Web Audio API (Custom SoundManager)
- State Management: Local Storage Persistence

