# Military Atlas + World Map Rig Notes

## User Reference: Russo-Turkish War Atlas Map

The uploaded atlas reference is not a video style to copy literally, but it solves readability better than the earlier V20 prototype.

Reusable rules:

- Treat revolts and repression as compact incident zones, not state-sized territory fills.
- Use hatched ovals/diamonds for uprising, concentration, contested, or temporary-control areas.
- Put dates near routes or nodes when a route represents a dated operation.
- Route labels must explain the function of the line: attack, retreat, pressure, demonstration, diplomacy, information spread, crossing.
- Major rivers and fortresses must be explicitly labeled when the narration depends on them.
- Avoid decorative lines across the whole map unless the line has a readable cause/effect label.
- Keep the full political map understandable while zooming: states, rivers, major cities, and the active node should remain readable.

## World Map Rig V2

Local template inspected:
`D:\history_video\test\World Map Rig\World Map Rig V2`

Tutorial frames extracted outside the repo:
`D:\history_video\reference_analysis\world_map_rig_tutorial_frames`

Observed strengths:

- Dark cinematic map treatment with clean yellow/white labels.
- Thin route arcs with clear endpoint labels.
- Call-out cards and image holders that feel like a finished motion-graphics package.
- Smooth camera and predictable marker duplication workflow.

Use in this project:

- Borrow the motion-design grammar: dark cards, thin arcs, restrained labels, image-holder cards, smooth camera, and a clean top subtitle band.
- Do not replace the historical Balkan basemap with the generic world map for campaign scenes. The generic map loses 1877 borders, Danube details, Ottoman/Romanian/Serbian political context, and fortress geography.
- If the `.aep` is used directly later, it should host historical basemap precomps and event overlays, not become the source of historical geography.

## V21 Redesign Decision

V21 keeps the historical Balkan basemap but changes event graphics:

- Removed broad unexplained uprising polygons.
- Added compact `incidentCluster()` hatched markers.
- Added `routeLabel()` for every long or abstract line.
- Added `dateBadge()` for dated context.
- Kept the minimal right-side state color key and top narration line.
