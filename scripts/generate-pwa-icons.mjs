import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const source = "apps/frontend/public/vercel.svg";
const outputDir = "apps/frontend/public/icons";

await mkdir(outputDir, { recursive: true });

await sharp(source)
  .resize(192, 192)
  .png()
  .toFile(`${outputDir}/icon-192.png`);

await sharp(source)
  .resize(512, 512)
  .png()
  .toFile(`${outputDir}/icon-512.png`);

