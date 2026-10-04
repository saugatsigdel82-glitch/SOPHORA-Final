# SOPHORA — NEXT TASKS

## Priority 1: Streamline Editorial Portfolio (`src/components/Portfolio.tsx`) [COMPLETED]
Pruned and aligned the editorial content with the exact 4-stage narrative flow defined in `AGENTS.md` Section 6:
- [x] **Editorial Page 1**:
  - Headline: *"BUILDING WITH INTENT IN AN ERA OF NOISE."*
  - Signature Quote: *"If you can't change the world around you, change yourself until the world has no choice but to change with you."*
  - ❌ Removed: Stats box, GPA badge (3.87), client counts (20+), GPS coordinates, and Kathmandu metadata pills.
- [x] **Editorial Page 2**:
  - Personal / founder narrative.
  - Featured ventures: **CultureNest** and **CultureBuilds** ONLY.
  - ❌ Removed: Old Section 4 (MUN / Model United Nations diplomacy).
- [x] **Final Page**:
  - Headline: *"LET'S BUILD SOMETHING LASTING."*
  - Subtitle: *"My inbox is open."*
  - Contact interaction (direct email / messaging).
  - ❌ Removed: GitHub / raw code repository CTA.

## Priority 2: Refine Identity Display Typography (`src/components/IdentityReveal.tsx`) [COMPLETED]
- [x] Polished `SAUGAT SIGDEL` typography to reflect refined Old English / Gothic-inspired display style (`Cinzel` bold display font).
- [x] Verified supporting line is strictly `DIVE INTO THE WORLD I'M BUILDING ↓` with zero extraneous taglines.

## Priority 3: Mobile & Responsive Polish [NEXT]
- [ ] Test mobile viewport touch-scrolling through the 3D cinematic sequence.
- [ ] Verify typography line wrapping and padding on mobile screens.

## Final Verification
- [ ] `node node_modules/typescript/bin/tsc --noEmit`
- [ ] `node node_modules/vite/bin/vite.js build`
- [ ] Browser visual walkthrough across Shots 1–6 and editorial sections
- [ ] Check Chrome DevTools console (must be 0 errors, 0 warnings)
- [ ] Performance check (maintain stable 60 FPS)

## Completed / Do Not Repeat
- Procedural 320m fBm terrain with clearing and perimeter ridge (`Terrain.tsx`) — DO NOT REDO.
- 6-shot wildlife documentary camera journey (`CinematicCamera.tsx`) — DO NOT REDO.
- Autonomous rhino spline navigation, shoreline deceleration & idle crossfade (`Rhino.tsx`) — DO NOT REDO.
- Dynamic 4-legged rhino terrain slope adaptation (pitch & roll) — DO NOT REDO.
- Physical corneal eye lenses on rhino skeleton — DO NOT REDO.
- Vegetation grounding and root submersion (`Vegetation.tsx`) — DO NOT REDO.
- Shoreline boulder seating (`Pond.tsx`) — DO NOT REDO.
- Atmospheric fog boundary containment (`Atmosphere.tsx`) — DO NOT REDO.
