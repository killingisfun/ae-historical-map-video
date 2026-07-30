---
name: ae-historical-map-video
description: Build or repair professional After Effects historical map videos with geo-locked city labels, routes, military symbols, territory colors, stable camera zoom levels, Russian subtitle narration, and reusable scripts. Use when Codex is asked to create, improve, debug, or package AE JSX map animations for wars, campaigns, battles, borders, movements, or historical explainer videos.
---

# AE Historical Map Video

## Core Workflow

1. Treat the video as a narrated map story, not a slideshow.
2. Build a storyboard where every beat has: time range, one Russian subtitle sentence, focus coordinates, zoom plan, active cities, active routes, and visible territories.
3. Render or reuse a clean basemap without provider labels when possible; draw Russian territory names, city dots, capitals, rivers, routes, legend, and military symbols yourself.
4. In After Effects, make the map/city/route layers geo-locked to one map rig, then animate only the rig for camera movement.
5. Keep overlay visual sizes stable under zoom with inverse scale/stroke keyframes. Do not use AE expressions unless the user asks for an expression-driven template.
6. Validate the JSX syntax before giving it to the user, and tell them the exact composition name to open.

## Production Rules

- Use four fixed zoom levels only: `FAR`, `MED`, `CLOSE`, `MACRO`.
- Mostly use `FAR` and `MED`; reserve `CLOSE` for named operational areas and `MACRO` for tiny movements such as river crossings.
- Center the active event. For a route, center on the route midpoint or strategic node, not on the country as a whole.
- Keep the active point inside the readable map area, away from the top title bar, footer, and legend.
- Never let labels, dots, arrowheads, or milsymbol icons drift independently from their coordinates.
- Draw only the current active route unless the narrative explicitly compares multiple routes.
- Remove obsolete arrows when the story moves to a new event.
- Keep arrowheads modest. A good starting point at 1920x1080 is a 4 px route stroke and a 15x10 px arrowhead before inverse scaling.
- Always include a legend if the map uses territory colors, military icons, or multiple route colors.
- Rivers, lakes, seas, and coast water must remain in one blue family; do not use blue for state fills.
- Russian labels should not fight source-map labels. Prefer clean basemaps and self-drawn Russian labels.

## Bundled Resources

- `scripts/prepare_russo_turkish_1877_demo.ps1`: copies the bundled map, icons, and JSX into a runnable AE folder.
- `scripts/ae_russo_turkish_1877_v21_reference_style.jsx`: current working AE JSX template for the first third of the revised long-form story. It keeps corrected PNG projection origin, edge-clamped action camera, top one-sentence Russian subtitles, large changing year marker, no bottom text band, minimal right-side state legend, geo-locked city labels/routes, compact atlas-style uprising clusters, labeled routes/date badges, commander/avatar route heads, midline tactical pictograms, and geo-parenting via `setParentWithJump`.
- `scripts/render_1880_balkans_basemap.py`: basemap renderer for historical boundaries and Natural Earth rivers/lakes.
- `scripts/generate_milsymbol_assets.js`: regenerates APP-6/MIL-STD icon assets with `milsymbol` and `sharp`.
- `scripts/generate_iconify_tactical_assets.js`: generates Game-icons tactical pictograms through Iconify.
- `scripts/make_portrait_medallions.py`: normalizes generated portraits into round documentary medallions.
- `scripts/render_v21_preview_frames.py`: renders fast Pillow preview frames for the revised first-third story, including camera edge-clamp checks, top subtitle readability, year marker, minimal legend, compact uprising clusters, route labels, Danube crossing alignment, and no-black-edge QA before opening AE.
- `scripts/package.json`: Node dependencies for regenerating symbol assets.
- `assets/balkans_1880_real_boundaries_v9_overscan.png`: clean overscan Balkan basemap.
- `assets/milsymbol_assets/`: bundled friendly/hostile APP-6/MIL-STD symbol PNG/SVG assets generated with `milsymbol`.
- `assets/tactical_icons/`: generated Iconify/Game-icons SVG/PNG pictograms.
- `assets/portraits/medallions/`: commander medallion PNGs generated from the local image API and normalized by script.
- `references/storyboard_ru_turkish_war_1877_10min.md`: 10-minute Russian narration/storyboard draft.
- `references/production_rules.md`: stricter visual and camera checklist.
- `references/reference_crusades_map_analysis.md`: local reference-video analysis distilled into reusable map-video style rules.
- `references/reference_military_atlas_and_world_map_rig.md`: notes from the user's Russo-Turkish atlas reference and local World Map Rig V2 tutorial/template inspection.
- `references/sources.md`: source links for historical basemap, Natural Earth, and milsymbol.
- `references/local_image_api.md`: user's local Gemini tunnel/API workflow for generated portrait assets.

## Running The Demo

Use PowerShell:

```powershell
D:\history_video\codex-skills\ae-historical-map-video\scripts\prepare_russo_turkish_1877_demo.ps1
```

The script prints the output folder. In After Effects, run the copied `.jsx` from that folder with `File > Scripts > Run Script File...`.

## AE Implementation Pattern

- Convert lon/lat to map pixels with the same projection and extent as the basemap.
- Parent all map-space layers to `MAP_RIG_geo_locked_camera`.
- Parent label text to its point with `setParentWithJump`, then set the label's local offset.
- Use `cameraRoute(rig, t, coords, scale)` for movement beats and `cameraNode(rig, t, lon, lat, scale)` for city/siege beats. Use raw `cameraFocus(...)` only for deliberate non-action overview shots.
- Parent map-space layers to the rig with `setParentWithJump(rig)`, not plain `.parent = rig`, so camera math and layer coordinates stay in the same local space.
- Keep UI layers such as title, subtitles, footer, and legend outside the map rig.
- Use generated commander medallions and tactical pictograms only when they clarify who is moving, attacking, defending, or holding a node.
- Run `render_v21_preview_frames.py` or an equivalent visual QA pass before handing over a larger scripted animation.
- When the basemap PNG is centered and scaled in AE, `xy(lon, lat)` must include the map image origin: `composition_center - scaled_image_size / 2 + projected_pixel * image_scale`. Do not return only `projected_pixel * image_scale`; that creates visible drift at `CLOSE` and `MACRO`.
- Clamp camera rig positions against the transformed basemap bounds. Action should stay as centered as possible, but the map must never reveal black empty edges during edge-area events.
- Use the current UI pattern for narration builds: one top subtitle sentence per beat, a large year marker near the lower-left, and no bottom narration band. Keep the right-side legend minimal and titleless: color swatches plus state names only.
- Place commander medallions and PNG tactical icons through stable geo anchors: the anchor is lon/lat, while portrait/icon offsets are local screen-space children. Do not use `xy(lon, lat) + dx/dy` for visible symbol placement, because zoom will multiply the offset.
- For movement beats, prefer `routeTrail()` plus `movingMedallion()`: the thin route line is only the trail, while the commander/avatar is the moving head of the action. Avoid separate arrowheads unless the scene needs a conventional map arrow.
- Put tactical pictograms on the middle of the route or the center of the contested area, not beside city labels. Use fixed city/node icons only when the icon is truly a fort, siege, capital, or objective at that place.
- Use translucent zone overlays for captured/control areas and dashed outlines for contested, siege, or uncertain areas. Keep them subtle enough that route trails and city labels remain primary.
- Do not use large arbitrary polygons for uprisings, massacres, public reaction, or other point-like events. Use compact atlas-style incident clusters: small hatched ovals/diamonds locked to real places, with labels and date badges.
- Every non-obvious route must carry its own map label such as "распространение восстания", "сербское наступление", "османское давление", "проход через Румынию", or "ночная переправа". Unlabeled long lines read as mistakes.
- World Map Rig V2 is useful as a motion-design reference: dark callout panels, thin arcs, yellow labels, image holders, and smooth camera. Do not replace the historical Balkan basemap with the generic world map if that would remove historical borders, rivers, or campaign context.
- If old AE compositions show orange expression errors, inspect older comps first; the bundled template avoids expressions.

## When Extending To 10 Minutes

Use the storyboard as the source of truth. Each 10-second beat should create or update only the overlays needed for that sentence. Camera movement should be continuous: zoom out, pan, then zoom in when moving to a distant event. For nearby events, use a same-scale pan or `MACRO` only when the physical route is too short to read at `MED`.
