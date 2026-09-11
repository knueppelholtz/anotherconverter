export type OutputFormat = 'image/webp' | 'image/png' | 'image/jpeg' | 'image/avif' | 'image/x-icon';

export interface FormatOption {
	value: OutputFormat;
	label: string;
	ext: string;
	lossy: boolean;
}

export const FORMAT_OPTIONS: FormatOption[] = [
	{ value: 'image/webp', label: 'WebP', ext: 'webp', lossy: true },
	{ value: 'image/png', label: 'PNG', ext: 'png', lossy: false },
	{ value: 'image/jpeg', label: 'JPEG', ext: 'jpg', lossy: true },
	{ value: 'image/avif', label: 'AVIF', ext: 'avif', lossy: true },
	{ value: 'image/x-icon', label: 'ICO', ext: 'ico', lossy: false }
];

const ICO_MAX_SIZE = 256;

type InputKind = 'raster' | 'svg' | 'heic';

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

function detectInputKind(file: File): InputKind {
	const name = file.name.toLowerCase();
	if (file.type === 'image/svg+xml' || name.endsWith('.svg')) return 'svg';
	if (HEIC_TYPES.has(file.type) || name.endsWith('.heic') || name.endsWith('.heif')) return 'heic';
	return 'raster';
}

export function isSupportedImage(file: File): boolean {
	return file.type.startsWith('image/') || detectInputKind(file) !== 'raster';
}

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const value = bytes / Math.pow(1024, i);
	return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function outputFileName(originalName: string, ext: string): string {
	const base = originalName.replace(/\.[^./\\]+$/, '');
	return `${base}.${ext}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Conversion failed'))),
			type,
			quality
		);
	});
}

async function decodeSvg(file: File): Promise<ImageBitmap> {
	const text = await file.text();
	const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error('Could not read SVG'));
			img.src = url;
		});
		// SVGs without an intrinsic size fall back to the CSS replaced-element default
		const width = img.naturalWidth || 512;
		const height = img.naturalHeight || 512;
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas is not supported');
		ctx.drawImage(img, 0, 0, width, height);
		return createImageBitmap(canvas);
	} finally {
		URL.revokeObjectURL(url);
	}
}

async function decodeHeic(file: File): Promise<ImageBitmap> {
	const { heicTo } = await import('heic-to');
	return heicTo({ blob: file, type: 'bitmap' });
}

async function decodeToBitmap(file: File, kind: InputKind): Promise<ImageBitmap> {
	if (kind === 'svg') return decodeSvg(file);
	if (kind === 'heic') return decodeHeic(file);
	return createImageBitmap(file);
}

async function encodeAvif(imageData: ImageData, quality: number): Promise<Blob> {
	const { encode } = await import('@jsquash/avif');
	const buffer = await encode(imageData, { quality: Math.round(quality * 100) });
	return new Blob([buffer], { type: 'image/avif' });
}

// Wraps a PNG blob in a minimal single-image ICO container. Modern ICO
// readers accept a PNG payload directly instead of a legacy BMP bitmap.
function pngToIco(pngBytes: Uint8Array<ArrayBuffer>, width: number, height: number): Blob {
	const header = new Uint8Array(6);
	new DataView(header.buffer).setUint16(2, 1, true); // type: icon
	new DataView(header.buffer).setUint16(4, 1, true); // image count: 1

	const entry = new Uint8Array(16);
	const entryView = new DataView(entry.buffer);
	entry[0] = width >= ICO_MAX_SIZE ? 0 : width;
	entry[1] = height >= ICO_MAX_SIZE ? 0 : height;
	entryView.setUint16(4, 1, true); // color planes
	entryView.setUint16(6, 32, true); // bits per pixel
	entryView.setUint32(8, pngBytes.byteLength, true); // payload size
	entryView.setUint32(12, header.byteLength + entry.byteLength, true); // payload offset

	return new Blob([header, entry, pngBytes], { type: 'image/x-icon' });
}

async function encodeIco(canvas: HTMLCanvasElement): Promise<Blob> {
	const maxDim = Math.max(canvas.width, canvas.height);
	const scale = Math.min(1, ICO_MAX_SIZE / maxDim);
	const width = Math.round(canvas.width * scale);
	const height = Math.round(canvas.height * scale);

	let source = canvas;
	if (scale < 1) {
		const resized = document.createElement('canvas');
		resized.width = width;
		resized.height = height;
		const ctx = resized.getContext('2d');
		if (!ctx) throw new Error('Canvas is not supported');
		ctx.drawImage(canvas, 0, 0, width, height);
		source = resized;
	}

	const pngBlob = await canvasToBlob(source, 'image/png');
	const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
	return pngToIco(pngBytes, width, height);
}

export async function convertImage(
	file: File,
	format: OutputFormat,
	quality: number
): Promise<Blob> {
	const bitmap = await decodeToBitmap(file, detectInputKind(file));

	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported');

	if (format === 'image/jpeg') {
		// JPEG has no alpha channel, transparent areas would otherwise turn black
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	if (format === 'image/avif') {
		return encodeAvif(ctx.getImageData(0, 0, canvas.width, canvas.height), quality);
	}

	if (format === 'image/x-icon') {
		return encodeIco(canvas);
	}

	return canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
}
