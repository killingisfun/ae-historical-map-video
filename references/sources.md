# Map And Symbol Sources

Use primary/open-license sources first and keep the source URL visible in project notes when shipping a reusable template.

## Historical Borders

- Historical basemaps by Petr Pridal / aourednik:
  https://github.com/aourednik/historical-basemaps
- Current bundled demo uses `world_1880.geojson` as an approximate historical boundary layer for the 1877-1878 Russo-Turkish War.
- Treat 1880 borders as a close visual proxy, not a perfect battle-atlas source.

## Physical Geography

- Natural Earth 10m Physical Vectors:
  https://www.naturalearthdata.com/downloads/10m-physical-vectors/
- Use rivers/lakes for orientation, especially the Danube, Prut, Black Sea, and Balkan mountain context.

## Military Symbols

- milsymbol:
  https://github.com/spatialillusions/milsymbol
- Use for APP-6 / MIL-STD-style friendly and hostile unit symbols.
- Prefer generated PNGs for After Effects compatibility, keep SVGs as source assets.

## Tactical Icons

- Iconify:
  https://iconify.design/
- Game-icons Iconify package:
  https://icon-sets.iconify.design/game-icons/
- Game-icons license:
  https://game-icons.net/about.html
- Use Game-icons for readable documentary pictograms such as cavalry, cannon, fort, objective flag, camp, and crossed swords. Keep attribution in project notes because Game-icons uses CC BY 3.0.

## After Effects

- Keep JSX outputs standalone where possible.
- Put all runtime assets next to the JSX when handing a file to a non-technical user:
  - basemap PNG;
  - `milsymbol_assets/`;
  - JSX script.
