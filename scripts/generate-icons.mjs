#!/usr/bin/env node
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "../public/icons");

const sizes = [192, 512];

for (const size of sizes) {
  // Créer un carré arrondi avec fond sombre et une icône centrée
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
      <rect x="${size * 0.15}" y="${size * 0.25}" width="${size * 0.7}" height="${size * 0.55}" rx="${size * 0.05}" fill="#6366f1" opacity="0.3"/>
      <rect x="${size * 0.15}" y="${size * 0.32}" width="${size * 0.7}" height="${size * 0.45}" rx="${size * 0.05}" fill="#6366f1"/>
      <rect x="${size * 0.15}" y="${size * 0.25}" width="${size * 0.35}" height="${size * 0.12}" rx="${size * 0.05}" fill="#818cf8"/>
      <rect x="${size * 0.3}" y="${size * 0.44}" width="${size * 0.4}" height="${size * 0.04}" rx="${size * 0.02}" fill="white" opacity="0.6"/>
      <rect x="${size * 0.3}" y="${size * 0.52}" width="${size * 0.3}" height="${size * 0.04}" rx="${size * 0.02}" fill="white" opacity="0.4"/>
      <rect x="${size * 0.3}" y="${size * 0.60}" width="${size * 0.35}" height="${size * 0.04}" rx="${size * 0.02}" fill="white" opacity="0.3"/>
    </svg>
  `);

  await sharp(svg)
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

  console.log(`✓ Icône ${size}x${size} générée`);
}
