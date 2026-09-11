import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('static/icon.svg');

const targets = [
	{ file: 'static/favicon.png', size: 64 },
	{ file: 'static/apple-touch-icon.png', size: 180 },
	{ file: 'static/pwa-192x192.png', size: 192 },
	{ file: 'static/pwa-512x512.png', size: 512 }
];

for (const { file, size } of targets) {
	await sharp(svg, { density: 384 }).resize(size, size).png().toFile(file);
	console.log('wrote', file);
}
