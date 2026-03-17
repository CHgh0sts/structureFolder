#!/usr/bin/env node
/**
 * Génère des icônes PNG simples pour la PWA sans dépendances canvas.
 * Ces icônes utilisent du SVG converti en base64 puis enregistré.
 * Pour une production, utilisez un outil comme sharp ou imagemagick.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "../public/icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG simple pour les icônes
function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0f172a"/>
  <text x="50%" y="55%" font-size="${size * 0.55}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui">📂</text>
</svg>`;
}

const sizes = [192, 512];
for (const size of sizes) {
  const svgContent = createSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ Icône SVG ${size}x${size} créée : ${svgPath}`);
  console.log(`  Note: Renommez en .png ou utilisez sharp pour convertir en PNG.`);
}

console.log("\nPour générer de vraies icônes PNG, installez sharp:");
console.log("  npm install sharp");
console.log("  Puis modifiez ce script pour utiliser sharp.");
