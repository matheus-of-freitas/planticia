/**
 * Generates Planticia app icon and splash screen assets.
 *
 * Usage: node scripts/generate-assets.js
 * Requires: @napi-rs/canvas (installed as devDependency)
 */

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'apps', 'mobile', 'assets', 'images');

// Brand colors
const PRIMARY_GREEN = '#2E7D32';
const DARK_GREEN = '#1B5E20';
const LIGHT_GREEN = '#4CAF50';
const MINT_BG = '#F1F8E9';

/**
 * Draws a stylized leaf/sprout shape on the canvas context.
 * The shape is drawn centered at (cx, cy) with the given size.
 */
function drawSprout(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;

  // Main stem
  const stemWidth = size * 0.06;
  const stemHeight = size * 0.45;
  const stemX = cx;
  const stemBottom = cy + size * 0.25;
  const stemTop = stemBottom - stemHeight;

  // Draw stem with rounded cap
  ctx.beginPath();
  ctx.moveTo(stemX - stemWidth, stemBottom);
  ctx.lineTo(stemX - stemWidth, stemTop + stemWidth);
  ctx.quadraticCurveTo(stemX - stemWidth, stemTop, stemX, stemTop);
  ctx.quadraticCurveTo(stemX + stemWidth, stemTop, stemX + stemWidth, stemTop + stemWidth);
  ctx.lineTo(stemX + stemWidth, stemBottom);
  ctx.closePath();
  ctx.fill();

  // Left leaf
  const leafSize = size * 0.32;
  const leftLeafCx = cx - leafSize * 0.35;
  const leftLeafCy = stemTop + stemHeight * 0.25;

  ctx.beginPath();
  ctx.moveTo(cx - stemWidth * 0.5, leftLeafCy + leafSize * 0.1);
  ctx.quadraticCurveTo(
    leftLeafCx - leafSize * 0.9, leftLeafCy - leafSize * 0.3,
    leftLeafCx - leafSize * 0.15, leftLeafCy - leafSize * 0.75
  );
  ctx.quadraticCurveTo(
    leftLeafCx + leafSize * 0.5, leftLeafCy - leafSize * 0.5,
    cx - stemWidth * 0.5, leftLeafCy + leafSize * 0.1
  );
  ctx.closePath();
  ctx.fill();

  // Right leaf (mirrored, slightly higher)
  const rightLeafCx = cx + leafSize * 0.35;
  const rightLeafCy = stemTop + stemHeight * 0.1;

  ctx.beginPath();
  ctx.moveTo(cx + stemWidth * 0.5, rightLeafCy + leafSize * 0.1);
  ctx.quadraticCurveTo(
    rightLeafCx + leafSize * 0.9, rightLeafCy - leafSize * 0.3,
    rightLeafCx + leafSize * 0.15, rightLeafCy - leafSize * 0.75
  );
  ctx.quadraticCurveTo(
    rightLeafCx - leafSize * 0.5, rightLeafCy - leafSize * 0.5,
    cx + stemWidth * 0.5, rightLeafCy + leafSize * 0.1
  );
  ctx.closePath();
  ctx.fill();

  // Small center sprout/bud at top
  const budSize = size * 0.12;
  const budY = stemTop - budSize * 0.2;

  ctx.beginPath();
  ctx.moveTo(cx, stemTop + stemWidth);
  ctx.quadraticCurveTo(
    cx - budSize * 0.8, budY - budSize * 0.5,
    cx, budY - budSize
  );
  ctx.quadraticCurveTo(
    cx + budSize * 0.8, budY - budSize * 0.5,
    cx, stemTop + stemWidth
  );
  ctx.closePath();
  ctx.fill();

  // Ground/soil arc at bottom
  ctx.beginPath();
  ctx.ellipse(cx, stemBottom + size * 0.02, size * 0.15, size * 0.04, 0, 0, Math.PI);
  ctx.fill();
}

/**
 * Draws a simplified leaf for small sizes (favicon).
 */
function drawSimpleLeaf(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;

  // Single leaf shape
  const leafW = size * 0.35;
  const leafH = size * 0.5;

  ctx.beginPath();
  ctx.moveTo(cx, cy + leafH * 0.5);
  ctx.quadraticCurveTo(cx - leafW, cy - leafH * 0.1, cx, cy - leafH * 0.5);
  ctx.quadraticCurveTo(cx + leafW, cy - leafH * 0.1, cx, cy + leafH * 0.5);
  ctx.closePath();
  ctx.fill();

  // Center vein
  ctx.strokeStyle = color === '#2E7D32' ? MINT_BG : '#FFFFFF';
  ctx.lineWidth = size * 0.03;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - leafH * 0.35);
  ctx.lineTo(cx, cy + leafH * 0.3);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // Small stem
  ctx.fillStyle = color;
  const stemW = size * 0.04;
  ctx.beginPath();
  ctx.moveTo(cx - stemW, cy + leafH * 0.5);
  ctx.lineTo(cx - stemW, cy + leafH * 0.7);
  ctx.quadraticCurveTo(cx, cy + leafH * 0.75, cx + stemW, cy + leafH * 0.7);
  ctx.lineTo(cx + stemW, cy + leafH * 0.5);
  ctx.closePath();
  ctx.fill();
}

function addRoundedBackground(ctx, w, h, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, radius);
  ctx.fill();
}

function generateIcon() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Rounded background
  addRoundedBackground(ctx, size, size, size * 0.2, MINT_BG);

  // Draw sprout
  drawSprout(ctx, size / 2, size / 2 + size * 0.02, size * 0.6, PRIMARY_GREEN);

  return canvas;
}

function generateSplashIcon() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background — just the sprout
  drawSprout(ctx, size / 2, size / 2 + size * 0.02, size * 0.7, PRIMARY_GREEN);

  return canvas;
}

function generateAndroidForeground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent — keep within 66% center safe zone
  const safeSize = size * 0.55;
  drawSprout(ctx, size / 2, size / 2 + size * 0.02, safeSize, PRIMARY_GREEN);

  return canvas;
}

function generateAndroidBackground() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = MINT_BG;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

function generateAndroidMonochrome() {
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // White sprout on transparent — Android will tint it
  const safeSize = size * 0.55;
  drawSprout(ctx, size / 2, size / 2 + size * 0.02, safeSize, '#FFFFFF');

  return canvas;
}

function generateFavicon() {
  const size = 48;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Simplified: just a leaf shape at this small size
  addRoundedBackground(ctx, size, size, size * 0.18, MINT_BG);
  drawSimpleLeaf(ctx, size / 2, size / 2, size * 0.7, PRIMARY_GREEN);

  return canvas;
}

async function main() {
  const assets = [
    { name: 'icon.png', generate: generateIcon },
    { name: 'splash-icon.png', generate: generateSplashIcon },
    { name: 'android-icon-foreground.png', generate: generateAndroidForeground },
    { name: 'android-icon-background.png', generate: generateAndroidBackground },
    { name: 'android-icon-monochrome.png', generate: generateAndroidMonochrome },
    { name: 'favicon.png', generate: generateFavicon },
  ];

  for (const asset of assets) {
    const canvas = asset.generate();
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(OUTPUT_DIR, asset.name);
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Generated ${asset.name} (${canvas.width}x${canvas.height})`);
  }

  console.log(`\nAll assets written to ${OUTPUT_DIR}`);
}

main().catch(console.error);
