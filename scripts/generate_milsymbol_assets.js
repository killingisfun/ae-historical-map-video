const fs = require("fs");
const path = require("path");
const ms = require("milsymbol");
const sharp = require("sharp");

const outDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "..", "assets", "milsymbol_assets");

fs.mkdirSync(outDir, { recursive: true });

const symbols = [
  ["friendly_infantry", "SFGPUCI----K"],
  ["hostile_infantry", "SHGPUCI----K"],
  ["friendly_unit", "SFGPU------K"],
  ["hostile_unit", "SHGPU------K"],
];

async function main() {
  for (const [name, sidc] of symbols) {
    const symbol = new ms.Symbol(sidc, {
      size: 90,
      uniqueDesignation: "",
      infoColor: "black",
    });
    const svg = symbol.asSVG();
    const svgPath = path.join(outDir, `${name}.svg`);
    const pngPath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(svgPath, svg, "utf8");
    await sharp(Buffer.from(svg)).resize(160, 160, { fit: "contain" }).png().toFile(pngPath);
    console.log(`wrote ${svgPath}`);
    console.log(`wrote ${pngPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
