# AGENTS.md — SOPHORA CORE SYSTEM MANUAL

> Permanent instruction manual and architectural reference for AI coding agents working on SOPHORA.
> Read this file first when starting a session.

---

## 1. PROJECT IDENTITY & EXPERIENCE FLOW

**SOPHORA** is Saugat Sigdel's cinematic personal portfolio. It is an authored, real-time 3D wildlife experience that transitions seamlessly into an editorial personal narrative.

### The Experience Flow
$$\text{Cinematic Forest} \longrightarrow \text{Rhino Journey} \longrightarrow \text{Pond Arrival} \longrightarrow \text{Identity Reveal} \longrightarrow \text{Editorial Portfolio}$$

### Visual Direction
* **Aesthetic Tone**: Natural, cinematic, sophisticated, editorial, and personal.
* **PROHIBITED TROPES**:
  * ❌ NO futuristic AI / tech website motifs
  * ❌ NO HUD overlays, cybernetic markers, or reticles
  * ❌ NO cyberpunk, neon glow, or wireframe grids
  * ❌ NO gaming UI, health bars, or mini-maps
  * ❌ NO fake system telemetry, FPS counters, or terminal code boxes
  * ❌ NO generic AI portfolio card grids

---

## 2. TECHNICAL ARCHITECTURE

* **Core Stack**: React 18.3 (`react`, `react-dom`) with TypeScript 5.4.
* **Build System**: Vite 5.2 (`vite`, `@vitejs/plugin-react`).
* **3D Runtime**: Three.js `0.164.1`, `@react-three/fiber` `8.16.6`, `@react-three/drei` `9.105.6`.
* **Viewport & Canvas**:
  * Fixed fullscreen `<Canvas>` (`pointerEvents: 'none'`, `zIndex: 1`) in [`src/App.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/App.tsx).
  * Color space: `THREE.SRGBColorSpace`, Tone mapping: `THREE.ACESFilmicToneMapping` (exposure: 1.35).
* **Scroll System**:
  * Pure viewport scrolling drives the experience across a `480vh` spacer.
  * Normalized progress: `progress = clamp(window.scrollY / (window.innerHeight * 3.8), 0, 1)`.
  * The 3D camera finishes at `progress = 1.0`, smoothly handing over to the editorial portfolio (`zIndex: 20`, `pointerEvents: 'auto'`).
* **Camera System ([`src/components/CinematicCamera.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/CinematicCamera.tsx))**:
  * Camera acts as a detached wildlife documentary observer (not a game follow camera).
  * Maps scroll progress across 6 authored shots with exponential damping (`1 - Math.exp(-6 * delta)`):
    * **Shot 1 (0%–15%)**: Canopy aisle establishing view.
    * **Shot 2 (15%–30%)**: Understory forest glide revealing depth and flora.
    * **Shot 3 (30%–45%)**: Animal discovery framing as rhino emerges into the clearing.
    * **Shot 4 (45%–70%)**: Cinematic 3/4 leading tracking shot following rhino movement.
    * **Shot 5 (70%–85%)**: Low-angle pond basin reveal and shoreline approach.
    * **Shot 6 (85%–100%)**: Elevated crane finale framing rhino settled beside the watering hole.
  * Coordinates and look targets are strictly guarded with `Number.isFinite()` to guarantee zero black-screen crashes.
* **Autonomous Rhino System ([`src/components/Rhino.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Rhino.tsx))**:
  * Runs independently along an authored 3D Catmull-Rom spline loop. Does NOT tie position to scroll.
  * Walks at ~1.15 m/s, begins decelerating 4.5m before goal, stops on dry land 1.9m back from water rim.
  * Smooth crossfade from `walking` into authentic `idle` animation on arrival, turning head to gaze across pond.
  * **Dynamic 4-Legged Slope Adaptation**: Samples ground elevation ahead (+0.65m) and behind (-0.65m) along dynamic tangent, plus lateral roll (±0.30m). Applies smoothed Euler pitch and roll (`'YXZ'`), keeping all 4 feet grounded across knolls.
  * Corneal eye lenses attached to skeletal eye bones (`L_Eye35`, `R_Eye38`) provide natural ocular specular gleam.
* **Terrain & Forest Floor ([`src/components/Terrain.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Terrain.tsx))**:
  * 320m x 320m deformed mesh generated with deterministic `getTerrainHeight(x, z)`.
  * Flat clearing center at (14, 0), pond depression at (28, 25), and peripheral boundary ridge rising to +14m (48m→133m radius).
  * 1024x1024 procedural multi-octave fBm CanvasTextures for albedo loam and tactile normal maps.
* **Vegetation System ([`src/components/Vegetation.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Vegetation.tsx))**:
  * Distributes realistic canopy trees, mid-story jungle trees, perimeter silhouette rings, fallen nurse logs, and clustered ferns.
  * PBR Material Optimization: `alphaTest: 0.48`, `depthWrite: true`, `depthTest: true`, `side: DoubleSide`. Completely eliminates ghosting and white-cloud compositing bugs.
  * Ferns have bases submerged `-0.06m` to `-0.07m` into the terrain to eliminate floating cards.
* **Atmosphere ([`src/components/Atmosphere.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Atmosphere.tsx))**:
  * Linear fog (`['#829680', 38, 130]`) matching background sky dome. Outer peripheral ridges seamlessly dissolve into morning mist with zero visible world edges.
* **Pond & Shoreline ([`src/components/Pond.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Pond.tsx))**:
  * Water disc at y = -0.48m with animated canvas ripple normal map. Shoreline rocks embedded at `y + 0.03m` into the bank.

---

## 3. CRITICAL CODE COMPONENTS

| Component | File Path | Primary Responsibility |
| :--- | :--- | :--- |
| **`App.tsx`** | [`src/App.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/App.tsx) | Canvas host, scroll progress calculator, z-index layout orchestration. |
| **`Experience.tsx`** | [`src/components/Experience.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Experience.tsx) | Root 3D scene assembler wrapping Atmosphere, Lighting, Camera, Terrain, Vegetation, Rhino, Pond in Suspense. |
| **`CinematicCamera.tsx`** | [`src/components/CinematicCamera.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/CinematicCamera.tsx) | Authors and damps the 6-shot wildlife camera progression. |
| **`Rhino.tsx`** | [`src/components/Rhino.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Rhino.tsx) | Autonomous spline locomotion, walk/idle animation transitions, slope pitch/roll adaptation, corneal lenses. |
| **`Terrain.tsx`** | [`src/components/Terrain.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Terrain.tsx) | Exports `getTerrainHeight(x, z)`, builds 320m deformed mesh, generates procedural fBm loam and normal maps. |
| **`Vegetation.tsx`** | [`src/components/Vegetation.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Vegetation.tsx) | Spawns canopy trees, boundary trees, fallen nurse logs, and grounded ferns with solid depth-writing materials. |
| **`Pond.tsx`** | [`src/components/Pond.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Pond.tsx) | Animated ripple water plane and grounded shoreline boulders. |
| **`Atmosphere.tsx`** | [`src/components/Atmosphere.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Atmosphere.tsx) | Linear distance fog and background sky dome synchronization. |
| **`Lighting.tsx`** | [`src/components/Lighting.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Lighting.tsx) | Morning daylight sun with 4K shadow maps and hemisphere sky/ground ambient fill. |
| **`IdentityReveal.tsx`** | [`src/components/IdentityReveal.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/IdentityReveal.tsx) | Negative space frosted typography overlay emerging near Shot 6. |
| **`Portfolio.tsx`** | [`src/components/Portfolio.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Portfolio.tsx) | Editorial personal narrative sections below the 3D scroll journey. |

---

## 4. ASSET SPECIFICATION & INVENTORY

All assets reside locally in `public/assets/`. Never rely on external CDNs.

### Active Scene Assets (In Use)
| Asset | Size | Loaded In | Purpose |
| :--- | :--- | :--- | :--- |
| **`rhino_animated.glb`** | 26.2 MB | `Rhino.tsx` | Hero white rhino with authentic skeletal `walking` and `idle` animation clips. |
| **`tree_realistic.glb`** | 58.8 MB | `Vegetation.tsx` | Primary high-detail canopy forest trees. |
| **`jungle_tree.glb`** | 4.5 MB | `Vegetation.tsx` | Understory tropical trees and boundary ring fill. |
| **`fern_beech.glb`** | 38.4 MB | `Vegetation.tsx` | Beech fern clusters at tree roots and clearing edges. |
| **`fern_3d.glb`** | 14.8 MB | `Vegetation.tsx` | Dense woodland frond clusters. |
| **`log_mossy.glb`** | 24.4 MB | `Vegetation.tsx` | Storytelling fallen nurse logs embedded in soil. |
| **`rocks.glb`** | 5.0 MB | `Pond.tsx` | Shoreline boulders (texture-optimized from 23MB via `scripts/optimize_rocks.cjs`). |

### Standby & Source Assets (DO NOT DELETE)
* **`forest_floor.glb`** (34.1 MB): Ground mesh reference; terrain currently synthesized via procedural fBm in `Terrain.tsx`.
* **`grass.glb`** (28.7 MB): Raw grass cluster model; ferns currently provide understory ground flora.
* **`rhino_sketchfab.glb`** (40.1 MB): Static source model before animation rigging.
* **`.backup/rocks.original.glb`** (23.4 MB): Original 4K rock texture model before JPEG compression.
* **`scripts/optimize_rocks.cjs`**: Standalone tool used to optimize rock GLB textures.

---

## 5. DESIGN & TYPOGRAPHY SPECIFICATION

### Identity Display
* **Hero Name**: `SAUGAT SIGDEL`
* **Typography Style**: Refined Old English / Gothic / blackletter-inspired display font (`Cinzel` / blackletter aesthetic).
* **Strict Constraints**: Must NOT look like medieval fantasy, gothic horror, heavy metal, or RPG gaming.
* **Supporting Line**: `DIVE INTO THE WORLD I'M BUILDING` with a minimal downward arrow (`↓`). No extraneous descriptors.

### Editorial Typography
* **Headings**: Premium modern grotesk/sans (`Cinzel`, `Space Grotesk`).
* **Body Copy**: Clean, highly readable sans (`Plus Jakarta Sans`).
* **Hierarchy**: Restrained, editorial, generous line height, ample whitespace.

---

## 6. INTENDED PORTFOLIO STRUCTURE

When completing or refining [`src/components/Portfolio.tsx`](file:///c:/Users/sauga/Downloads/Saugatuiux/SOPHORA/src/components/Portfolio.tsx), adhere to this exact 4-stage narrative flow:

1. **Opening Scene**: Cinematic 3D forest, autonomous rhino journey, and pond arrival.
2. **Identity Reveal**:
   * `SAUGAT SIGDEL`
   * `DIVE INTO THE WORLD I'M BUILDING ↓`
   * Nothing else.
3. **Editorial Page 1**:
   * Headline: `BUILDING WITH INTENT IN AN ERA OF NOISE.`
   * Signature Quote: *"If you can't change the world around you, change yourself until the world has no choice but to change with you."*
   * ❌ NO statistics boxes, NO GPS coordinates, NO GPA badges, NO client counts, NO Kathmandu metadata pills.
4. **Editorial Page 2**:
   * Personal & founder introduction.
   * Featured ventures: **CultureNest** and **CultureBuilds** ONLY.
   * ❌ No third page: The old MUN / diplomacy section is permanently removed.
5. **Final Page**:
   * Headline: `LET'S BUILD SOMETHING LASTING.`
   * Subtitle: `My inbox is open.`
   * ❌ No GitHub / raw code repository CTAs.

---

## 7. FUTURE AGENT HANDOFF PROTOCOL

### When Starting a New Session
A new AI coding agent should **NOT** immediately scan or read the entire repository.
1. Read **`AGENTS.md`** (this manual).
2. Read **`PROJECT_STATE.md`** (current exact state & metrics).
3. Read **`TODO_NEXT.md`** (active priority tasks).
4. Read the most recent entry in **`IMPLEMENTATION_LOG.md`**.
5. Inspect **ONLY** the specific files needed for the current task.
6. Do **NOT** redo or rebuild completed work unless browser verification shows a regression.

### When Ending a Session (Mandatory End-of-Session Protocol)
Before ending any coding session:
1. Update **`PROJECT_STATE.md`** with the live status, verification results, and exact next action.
2. Update **`TODO_NEXT.md`** (move completed tasks to completed section).
3. Append a concise entry to **`IMPLEMENTATION_LOG.md`**.
4. Record all files modified.
5. Record verification checks (`tsc --noEmit`, `vite build`, browser checks).
6. Record the latest Git commit hash.
7. State the **EXACT NEXT ACTION** clearly.
8. Explicitly document anything that must **NOT** be redone.
