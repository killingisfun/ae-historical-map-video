# Historical AE Map Production Rules

## Camera

- Use exactly four named zoom levels: `FAR`, `MED`, `CLOSE`, `MACRO`.
- Keep zoom values consistent inside one project. Do not use ad hoc values like 147, 153, or 212.
- Center each beat on the active event:
  - route: midpoint or decisive node;
  - siege: besieged city;
  - diplomatic/context beat: whole region or highlighted territory group.
- If there is action in the sentence, the camera must be over that action. Do not place the active movement in a corner for composition balance.
- Implement action beats with `cameraRoute()` or `cameraNode()`, not hand-picked nearby coordinates.
- For tiny movements, such as Zimnitsa to Svishtov, use `MACRO`.
- For long operational movement, use `MED` or a short `FAR -> MED` transition.
- Avoid cutting between unrelated framed chunks. Move as one camera: overview, pan, controlled zoom.

## Geo Locking

- Every city, point, route, ring, and military marker must be placed by lon/lat.
- The lon/lat projection must land in the same composition coordinate space as the centered/scaled PNG basemap. Include the basemap layer's top-left origin after scaling.
- Map-space overlays belong under one `MAP_RIG_geo_locked_camera` null.
- Parent map-space overlays with `setParentWithJump(rig)`. Plain `.parent = rig` can compensate transforms and make camera focus math disagree with visible layer positions.
- UI layers do not belong under the map rig.
- Text labels attached to city dots must use `setParentWithJump(dot)` and then local offsets.
- Avoid AE expressions for scale compensation unless absolutely necessary; keyframe inverse scale/stroke values from the camera table.

## Map Design

- Use a clean basemap without provider labels if possible.
- Draw Russian labels manually for states, capitals, rivers, active cities, and routes.
- Keep seas, lakes, rivers, and coastline water in one blue color family.
- Do not use blue as a state fill when blue is used for water and Russian movement.
- Territory fills should be muted and transparent enough for rivers and borders to remain visible.
- Always include a legend when territory colors or route colors are present.

## Routes And Symbols

- Draw only active arrows unless the narration needs comparison.
- For movement beats, treat the route line as a trail and the commander/avatar medallion as the moving head. This is clearer than a separate arrowhead plus a detached portrait.
- Keep arrow strokes thin enough for `MACRO`; start at 4 px with inverse stroke compensation.
- Keep arrowheads small and proportional; start at about 15x10 px at 1920x1080.
- Use `milsymbol` for unit-style symbols when a military icon is needed, but do not overfill the map.
- Use Iconify/Game-icons pictograms for readable story aids: cavalry, cannon, fort, camp, objective flag, and crossed swords.
- Keep pictograms next to the active route or node and fade them with the same beat as the route.
- Tactical pictograms must be large enough to read at preview resolution. At 1920x1080, start near 90-110 px visual size for story icons and reduce only when they collide with city names.
- Place PNG pictograms through a geo anchor plus local child offset. Never set a symbol to `map point + dx/dy`, because zoom turns that offset into apparent drifting.
- Put movement pictograms on the route midline, not beside city labels. City-adjacent pictograms are reserved for actual node objects such as forts, siege marks, capitals, or objectives.
- City labels should be small, dark-backed or shadowed, and readable against territory colors.

## Commander Cards

- Use generated or historical portrait assets only as support for the map story.
- Normalize people into round medallions before importing into AE.
- Put medallions near the relevant route/node or in a deliberate UI card; never let them hide the active path.
- For active action beats, put medallions in stable local offsets around the route midpoint or contested node. If the story has two sides, flank the node with the two commanders.
- Add names and roles in AE text layers, not inside the generated portrait image.
- State generated portraits as historically inspired unless the asset is a verified public-domain portrait.

## Territory And Battle State

- Use soft translucent fills for areas that become controlled or operationally occupied.
- Use dashed outlines for contested, uncertain, siege, or disputed areas.
- Territory overlays should sit below active routes, markers, and commander avatars.

## 2.5D / Cinematic Feel

- Prefer controlled 2.5D effects inside AE: map shadow, light sweep, mild parallax panels, animated pulses, and depth-coded UI cards.
- Do not switch to true 3D unless the map geometry and labels can still remain geo-locked.
- If true 3D is used later, build it as a separate map precomp and validate screenshots at every action beat.

## Russian Narration

- Use one complete subtitle sentence per beat.
- Write like a blogger explaining the map: concrete, chronological, and tied to visible movement.
- When a sentence mentions movement, create a matching route or camera move.
- When a sentence mentions a place, make that place visibly marked at that moment.
