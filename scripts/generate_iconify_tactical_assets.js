const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { iconToSVG, replaceIDs } = require("@iconify/utils");
const iconSet = require("@iconify-json/game-icons/icons.json");

const outDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "..", "assets", "tactical_icons");

fs.mkdirSync(outDir, { recursive: true });

const ICONS = [
  ["cavalry", "cavalry"],
  ["cannon", "cannon"],
  ["fort", "military-fort"],
  ["hill_fort", "hill-fort"],
  ["objective_flag", "flag-objective"],
  ["crossed_swords", "crossed-swords"],
  ["camp", "camping-tent"],
];

const VARIANTS = [
  ["gold", "#E2A437"],
  ["blue", "#1E5BFF"],
  ["red", "#D5251A"],
  ["cream", "#F3E8C9"],
];

function svgFor(iconName, color) {
  const iconData = iconSet.icons[iconName];
  if (!iconData) throw new Error(`Missing icon ${iconName}`);
  const rendered = iconToSVG(iconData, {
    height: 128,
    width: 128,
    hFlip: false,
    vFlip: false,
  });
  const body = replaceIDs(rendered.body).replace(/currentColor/g, color);
  const width = iconData.width || iconSet.width || 512;
  const height = iconData.height || iconSet.height || 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="none"/>${body}</svg>`;
}

async function main() {
  for (const [slug, iconName] of ICONS) {
    for (const [variant, color] of VARIANTS) {
      const svg = svgFor(iconName, color);
      const svgPath = path.join(outDir, `${slug}_${variant}.svg`);
      const pngPath = path.join(outDir, `${slug}_${variant}.png`);
      fs.writeFileSync(svgPath, svg, "utf8");
      await sharp(Buffer.from(svg)).resize(160, 160, { fit: "contain" }).png().toFile(pngPath);
      console.log(`wrote ${pngPath}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
